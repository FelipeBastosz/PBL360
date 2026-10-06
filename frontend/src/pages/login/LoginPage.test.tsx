import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { authService } from '@/services/auth.service';
import { renderApp, sessionFor, studentUser } from '@/testing/renderApp';

vi.mock('@/services/auth.service');
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
});
