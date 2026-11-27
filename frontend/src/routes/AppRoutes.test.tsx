import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { commitmentTermsService } from '@/services/commitmentTerms.service';
import { sessionStore } from '@/services/sessionStore';
import { renderApp, sessionFor, studentUser } from '@/testing/renderApp';

vi.mock('@/services/auth.service');
vi.mock('@/services/room.service', () => ({
  roomService: { list: async () => [], listMyRooms: async () => [] },
}));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe('routing and session', () => {
  it('sends a visitor from a protected page to the login', async () => {
    renderApp('/turmas');

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('restores the stored session after a reload', async () => {
    sessionStore.save(sessionFor(studentUser));
    renderApp('/turmas');

    expect(
      await screen.findByText('Você ainda não faz parte de nenhuma turma.'),
    ).toBeInTheDocument();
  });

  it('keeps a signed-in user away from the login page', async () => {
    sessionStore.save(sessionFor(studentUser));
    renderApp('/entrar');

    expect(
      await screen.findByText('Você ainda não faz parte de nenhuma turma.'),
    ).toBeInTheDocument();
  });

  it('returns to the login with a notice once the session expires', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    sessionStore.save(sessionFor(studentUser, 5_000));
    renderApp('/turmas');
    await screen.findByText('Você ainda não faz parte de nenhuma turma.');

    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(
      screen.getByText('Sua sessão expirou. Entre novamente para continuar.'),
    ).toBeInTheDocument();
    expect(sessionStore.getToken()).toBeNull();
  });

  it('signs the user out', async () => {
    sessionStore.save(sessionFor(studentUser));
    const { user } = renderApp('/turmas');

    await user.click(await screen.findByRole('button', { name: 'Abrir menu da conta' }));
    await user.click(screen.getByRole('button', { name: 'Sair da conta' }));

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(sessionStore.getToken()).toBeNull();
  });

  it('opens the login page after the splash screen', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { user } = renderApp('/');

    expect(await screen.findByRole('heading', { name: 'PBL360' })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2_000);
    });

    expect(
      await screen.findByRole('button', { name: 'Entrar' }, { timeout: 5_000 }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Cadastre-se' }));

    expect(
      await screen.findByRole(
        'heading',
        {
          name: 'Como você deseja se cadastrar?',
        },
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();
  }, 15_000);

  it('shows the not found page for an unknown path', async () => {
    renderApp('/qualquer-coisa');

    expect(
      await screen.findByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument();
  });

  it('checks term acceptance on restored session and blocks protected routes until accepted', async () => {
    vi.spyOn(commitmentTermsService, 'getMyAcceptanceStatus').mockResolvedValue({
      aceito: false,
      versaoAceita: '1.1',
      aceitoEm: '2026-10-01T10:00:00.000Z',
      versaoVigente: '1.2',
    });
    vi.spyOn(commitmentTermsService, 'getCurrentTerm').mockResolvedValue({
      versao: '1.2',
      titulo: 'Termos v1.2',
      texto: '### 1. Regras\n\nConteúdo vigente para sessão restaurada.',
    });
    vi.spyOn(commitmentTermsService, 'acceptTerm').mockResolvedValue({
      aceito: true,
      versaoAceita: '1.2',
      aceitoEm: '2026-11-18T12:00:00.000Z',
      versaoVigente: '1.2',
    });

    sessionStore.save(sessionFor(studentUser));
    const { user } = renderApp('/turmas');

    expect(
      await screen.findByRole('heading', {
        name: 'Atualização dos Termos de Uso e Política de Privacidade',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Você ainda não faz parte de nenhuma turma.'),
    ).not.toBeInTheDocument();

    await user.click(await screen.findByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(
      await screen.findByText('Você ainda não faz parte de nenhuma turma.'),
    ).toBeInTheDocument();
  });

  it('blocks protected routes when term acceptance check fails and allows retrying', async () => {
    vi.spyOn(commitmentTermsService, 'getMyAcceptanceStatus')
      .mockRejectedValueOnce(
        new ApiError(500, ['Erro interno'], { statusCode: 500, message: 'Erro interno' }),
      )
      .mockResolvedValueOnce({
        aceito: true,
        versaoAceita: '1.2',
        aceitoEm: '2026-11-17T12:00:00.000Z',
        versaoVigente: '1.2',
      });

    sessionStore.save(sessionFor(studentUser));
    const { user } = renderApp('/turmas');

    expect(
      await screen.findByRole('heading', { name: 'Não foi possível verificar os termos' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Você ainda não faz parte de nenhuma turma.'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(
      await screen.findByText('Você ainda não faz parte de nenhuma turma.'),
    ).toBeInTheDocument();
  });

  it.each([
    ['network error', new ApiError(0, ['Sem conexão'])],
    ['proxy 500 without JSON body', new ApiError(500, ['Erro no servidor'], '')],
    ['service unavailable 503', new ApiError(503, ['Indisponível'])],
  ])('shows server unavailable screen on %s and allows retrying', async (_label, error) => {
    vi.spyOn(commitmentTermsService, 'getMyAcceptanceStatus')
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({
        aceito: true,
        versaoAceita: '1.2',
        aceitoEm: '2026-11-17T12:00:00.000Z',
        versaoVigente: '1.2',
      });

    sessionStore.save(sessionFor(studentUser));
    const { user } = renderApp('/turmas');

    expect(
      await screen.findByRole('heading', { name: 'Servidor indisponível' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Não foi possível verificar os termos' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Você ainda não faz parte de nenhuma turma.'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(
      await screen.findByText('Você ainda não faz parte de nenhuma turma.'),
    ).toBeInTheDocument();
  });
});
