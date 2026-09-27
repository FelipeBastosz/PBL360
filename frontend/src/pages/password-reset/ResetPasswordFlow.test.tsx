import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { authService } from '@/services/auth.service';
import { renderApp, studentUser } from '@/testing/renderApp';

vi.mock('@/services/auth.service');

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

describe('Password Reset Flow', () => {
  describe('ForgotPasswordPage', () => {
    it('validates empty email before calling the API', async () => {
      const { user } = renderApp('/recuperar-senha');

      await user.click(await screen.findByRole('button', { name: 'Enviar' }));

      expect(screen.getByText('Informe seu e-mail.')).toBeInTheDocument();
      expect(authService.requestPasswordReset).not.toHaveBeenCalled();
    });

    it('requests reset code and navigates to the code page', async () => {
      vi.mocked(authService.requestPasswordReset).mockResolvedValue({
        mensagem: 'Código enviado.',
      });
      const { user } = renderApp('/recuperar-senha');

      await user.type(await screen.findByLabelText('Email Institucional'), studentUser.email);
      await user.click(screen.getByRole('button', { name: 'Enviar' }));

      expect(authService.requestPasswordReset).toHaveBeenCalledWith({ email: studentUser.email });
      expect(await screen.findByPlaceholderText('Código de recuperação')).toBeInTheDocument();
    });

    it('shows API error message when request fails', async () => {
      vi.mocked(authService.requestPasswordReset).mockRejectedValue(
        new ApiError(400, ['Erro ao enviar código.']),
      );
      const { user } = renderApp('/recuperar-senha');

      await user.type(await screen.findByLabelText('Email Institucional'), studentUser.email);
      await user.click(screen.getByRole('button', { name: 'Enviar' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao enviar código.');
    });
  });

  describe('ResetPasswordCodePage', () => {
    it('redirects to forgot-password when opened without email state', async () => {
      renderApp('/recuperar-senha/codigo');

      expect(await screen.findByLabelText('Email Institucional')).toBeInTheDocument();
    });

    it('validates code, requests token and navigates to new password page', async () => {
      vi.mocked(authService.validatePasswordResetCode).mockResolvedValue({
        token: 'reset-token-xyz',
        expiraEm: new Date(Date.now() + 900000).toISOString(),
      });
      const { user } = renderApp({
        pathname: '/recuperar-senha/codigo',
        state: { email: studentUser.email },
      });

      await user.type(await screen.findByPlaceholderText('Código de recuperação'), '123456');
      await user.click(screen.getByRole('button', { name: 'Confirmar' }));

      expect(authService.validatePasswordResetCode).toHaveBeenCalledWith({
        email: studentUser.email,
        codigo: '123456',
      });
      expect(await screen.findByLabelText('Nova Senha')).toBeInTheDocument();
    });

    it('shows error when code is invalid or expired', async () => {
      vi.mocked(authService.validatePasswordResetCode).mockRejectedValue(
        new ApiError(400, ['Código inválido ou expirado.']),
      );
      const { user } = renderApp({
        pathname: '/recuperar-senha/codigo',
        state: { email: studentUser.email },
      });

      await user.type(await screen.findByPlaceholderText('Código de recuperação'), '000000');
      await user.click(screen.getByRole('button', { name: 'Confirmar' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Código inválido ou expirado.');
    });

    it('resends recovery code on button click', async () => {
      vi.mocked(authService.requestPasswordReset).mockResolvedValue({
        mensagem: 'Código reenviado.',
      });
      const { user } = renderApp({
        pathname: '/recuperar-senha/codigo',
        state: { email: studentUser.email },
      });

      await user.click(await screen.findByRole('button', { name: 'Não recebeu? Reenviar código' }));

      expect(authService.requestPasswordReset).toHaveBeenCalledWith({ email: studentUser.email });
      expect(
        await screen.findByText('Enviamos um novo código para o seu e-mail.'),
      ).toBeInTheDocument();
    });
  });

  describe('ResetPasswordPage', () => {
    it('redirects to forgot-password when opened without token', async () => {
      renderApp('/recuperar-senha/nova-senha');

      expect(await screen.findByLabelText('Email Institucional')).toBeInTheDocument();
    });

    it('validates password length and matching confirmation', async () => {
      const { user } = renderApp({
        pathname: '/recuperar-senha/nova-senha',
        state: { token: 'reset-token-xyz' },
      });

      await user.type(await screen.findByLabelText('Nova Senha'), '123');
      await user.type(screen.getByLabelText('Confirmar Senha'), '456');
      await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

      expect(screen.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeInTheDocument();
      expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument();
      expect(authService.resetPassword).not.toHaveBeenCalled();
    });

    it('resets password and navigates to success page', async () => {
      vi.mocked(authService.resetPassword).mockResolvedValue({
        mensagem: 'Senha redefinida com sucesso.',
      });
      const { user } = renderApp({
        pathname: '/recuperar-senha/nova-senha',
        state: { token: 'reset-token-xyz' },
      });

      await user.type(await screen.findByLabelText('Nova Senha'), 'nova-senha-123');
      await user.type(screen.getByLabelText('Confirmar Senha'), 'nova-senha-123');
      await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

      expect(authService.resetPassword).toHaveBeenCalledWith({
        token: 'reset-token-xyz',
        novaSenha: 'nova-senha-123',
      });
      expect(await screen.findByText('Senha alterada com sucesso!')).toBeInTheDocument();
    });
  });

  describe('ResetPasswordSuccessPage', () => {
    it('redirects to login if accessed without completion state', async () => {
      renderApp('/recuperar-senha/concluido');

      expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    });

    it('returns to login when clicking the return button', async () => {
      const { user } = renderApp({
        pathname: '/recuperar-senha/concluido',
        state: { concluido: true },
      });

      expect(await screen.findByText('Senha alterada com sucesso!')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Voltar para o login' }));

      expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    });
  });

  describe('LoginForm integration', () => {
    it('contains link to password recovery', async () => {
      renderApp('/entrar');

      const link = await screen.findByRole('link', { name: 'Esqueceu a senha?' });
      expect(link).toHaveAttribute('href', '/recuperar-senha');
    });
  });
});
