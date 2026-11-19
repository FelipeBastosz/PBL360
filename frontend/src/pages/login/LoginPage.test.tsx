import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { authService } from '@/services/auth.service';
import { commitmentTermsService } from '@/services/commitmentTerms.service';
import { renderApp, sessionFor, studentUser } from '@/testing/renderApp';

vi.mock('@/services/auth.service');
vi.mock('@/services/commitmentTerms.service');
vi.mock('@/services/room.service', () => ({
  roomService: { list: async () => [], listMyRooms: async () => [] },
}));

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

async function fillAndSubmit(user: ReturnType<typeof renderApp>['user']) {
  await user.type(await screen.findByLabelText('Email Institucional'), 'ana@discente.uefs.br');
  await user.type(screen.getByLabelText('Senha'), 'senha-secreta');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginPage', () => {
  it('validates the fields before calling the API', async () => {
    const { user } = renderApp('/entrar');

    await user.click(await screen.findByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('Informe seu e-mail.')).toBeInTheDocument();
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('stores the session and opens the rooms page on success', async () => {
    vi.mocked(authService.login).mockResolvedValue(sessionFor(studentUser));
    const { user } = renderApp('/entrar?perfil=aluno');

    await fillAndSubmit(user);

    expect(
      await screen.findByText('Você ainda não faz parte de nenhuma turma.'),
    ).toBeInTheDocument();
    expect(authService.login).toHaveBeenCalledWith({
      email: 'ana@discente.uefs.br',
      senha: 'senha-secreta',
    });
    expect(localStorage.getItem('pbl360.session')).toContain('jwt-token');
  });

  it('shows the API message when the credentials are wrong', async () => {
    vi.mocked(authService.login).mockRejectedValue(
      new ApiError(401, ['E-mail ou senha inválidos.']),
    );
    const { user } = renderApp('/entrar');

    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
  });

  it('sends a pending account to the e-mail confirmation step', async () => {
    const message =
      'Confirme o código enviado para o seu e-mail institucional para ativar a conta.';
    vi.mocked(authService.login).mockRejectedValue(
      new ApiError(403, [message], {
        statusCode: 403,
        message,
        motivo: 'CONTA_NAO_VERIFICADA',
        usuarioId: studentUser.id,
        email: studentUser.email,
      }),
    );
    const { user } = renderApp('/entrar');

    await fillAndSubmit(user);

    expect(await screen.findByRole('heading', { name: 'Confirmar e-mail' })).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('keeps the chosen profile on the register link', async () => {
    renderApp('/entrar?perfil=professor');

    expect(await screen.findByRole('link', { name: 'Criar conta' })).toHaveAttribute(
      'href',
      '/cadastro?perfil=professor',
    );
  });

  it('shows reacceptance popup right after login when user version differs from current and proceeds after acceptance', async () => {
    vi.mocked(authService.login).mockResolvedValue(sessionFor(studentUser));
    vi.mocked(commitmentTermsService.getMyAcceptanceStatus).mockResolvedValue({
      aceito: false,
      versaoAceita: '1.1',
      aceitoEm: '2026-11-01T10:00:00.000Z',
      versaoVigente: '1.2',
    });
    vi.mocked(commitmentTermsService.getCurrentTerm).mockResolvedValue({
      versao: '1.2',
      titulo: 'Termos de Uso e Política de Privacidade – PBL360',
      texto: '# Termos de Uso e Política de Privacidade',
    });
    vi.mocked(commitmentTermsService.acceptTerm).mockResolvedValue({
      aceito: true,
      versaoAceita: '1.2',
      aceitoEm: '2026-11-17T12:00:00.000Z',
      versaoVigente: '1.2',
    });

    const { user } = renderApp('/entrar');
    await fillAndSubmit(user);

    expect(
      await screen.findByRole('heading', {
        name: 'Atualização dos Termos de Uso e Política de Privacidade',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/sua versão anterior: v1.1/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: 'Confirmar' });
    expect(submitBtn).toBeDisabled();

    await user.click(
      screen.getByRole('checkbox', {
        name: /eu li e concordo com os termos de uso e política de privacidade atualizados/i,
      }),
    );
    expect(submitBtn).toBeEnabled();

    await user.click(submitBtn);

    expect(commitmentTermsService.acceptTerm).toHaveBeenCalledWith('1.2');
    expect(
      await screen.findByText('Você ainda não faz parte de nenhuma turma.'),
    ).toBeInTheDocument();
  });

  it('logs out and remains on login page when clicking Sair da conta in popup', async () => {
    vi.mocked(authService.login).mockResolvedValue(sessionFor(studentUser));
    vi.mocked(commitmentTermsService.getMyAcceptanceStatus).mockResolvedValue({
      aceito: false,
      versaoAceita: null,
      aceitoEm: null,
      versaoVigente: '1.2',
    });
    vi.mocked(commitmentTermsService.getCurrentTerm).mockResolvedValue({
      versao: '1.2',
      titulo: 'Termos de Uso e Política de Privacidade – PBL360',
      texto: '# Termos de Uso e Política de Privacidade',
    });

    const { user } = renderApp('/entrar');
    await fillAndSubmit(user);

    expect(
      await screen.findByRole('heading', {
        name: 'Atualização dos Termos de Uso e Política de Privacidade',
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sair da conta' }));

    expect(
      screen.queryByRole('heading', {
        name: 'Atualização dos Termos de Uso e Política de Privacidade',
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });
});
