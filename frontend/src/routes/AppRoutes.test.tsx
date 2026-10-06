import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sessionStore } from '@/services/sessionStore';
import { renderApp, sessionFor, studentUser } from '@/testing/renderApp';

vi.mock('@/services/auth.service');
vi.mock('@/services/room.service', () => ({
  roomService: { list: async () => [], listMyRooms: async () => [] },
}));

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
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

    await user.click(await screen.findByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(sessionStore.getToken()).toBeNull();
  });

  it('opens the profile choice after the splash screen', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { user } = renderApp('/');

    expect(await screen.findByRole('heading', { name: 'PBL360' })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2_000);
    });

    expect(
      await screen.findByRole('heading', { name: 'Como você vai acessar?' }, { timeout: 5_000 }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Aluno/ }));

    expect(
      await screen.findByRole('link', { name: 'Criar conta' }, { timeout: 5_000 }),
    ).toHaveAttribute('href', '/cadastro?perfil=aluno');
  }, 15_000);

  it('shows the not found page for an unknown path', async () => {
    renderApp('/qualquer-coisa');

    expect(
      await screen.findByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument();
  });
});
