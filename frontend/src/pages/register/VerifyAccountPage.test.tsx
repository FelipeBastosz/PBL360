import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { authService } from '@/services/auth.service';
import { renderApp, sessionFor, studentUser } from '@/testing/renderApp';

vi.mock('@/services/auth.service');

const entry = {
  pathname: '/cadastro/verificar',
  state: { usuarioId: studentUser.id, email: studentUser.email },
};

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

describe('VerifyAccountPage', () => {
  it('goes back to the register form when opened without a pending account', async () => {
    renderApp('/cadastro/verificar');

    expect(await screen.findByRole('heading', { name: 'Criar conta' })).toBeInTheDocument();
  });

  it('confirms the code, shows the success screen and leads to the login', async () => {
    vi.mocked(authService.verifyEmailCode).mockResolvedValue({
      ...sessionFor(studentUser),
      mensagem: 'Conta ativada com sucesso.',
    });
    const { user } = renderApp(entry);

    await user.type(await screen.findByLabelText('Código'), '123456');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText('Cadastro concluído!')).toBeInTheDocument();
    expect(authService.verifyEmailCode).toHaveBeenCalledWith({
      usuarioId: studentUser.id,
      email: studentUser.email,
      codigo: '123456',
    });
    expect(localStorage.getItem('pbl360.session')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Ir para o login' }));

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('shows the API message when the code is wrong', async () => {
    vi.mocked(authService.verifyEmailCode).mockRejectedValue(
      new ApiError(400, ['Código de verificação inválido ou expirado.']),
    );
    const { user } = renderApp(entry);

    await user.type(await screen.findByLabelText('Código'), '000000');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Código de verificação inválido ou expirado.',
    );
  });

  it('resends the code and starts the cooldown', async () => {
    vi.mocked(authService.resendVerificationCode).mockResolvedValue({ mensagem: 'ok' });
    const { user } = renderApp(entry);

    await user.click(await screen.findByRole('button', { name: 'Não recebeu? Reenviar código' }));

    expect(authService.resendVerificationCode).toHaveBeenCalledWith({ email: studentUser.email });
    expect(await screen.findByRole('button', { name: /Reenviar código em \d+s/ })).toBeDisabled();
  });
});
