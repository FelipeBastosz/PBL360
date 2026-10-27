import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sessionStore } from '@/services/sessionStore';
import { renderApp, sessionFor, studentUser, tutorUser } from '@/testing/renderApp';
import type { SessionResponse } from '@/types/auth';

vi.mock('@/services/user.service');
vi.mock('@/services/room.service', () => ({
  roomService: { list: async () => [], listMyRooms: async () => [] },
}));

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

// Simulates another tab writing the shared session: the browser only notifies the other tabs.
function changeSessionInAnotherTab(session: SessionResponse | null) {
  act(() => {
    if (session) sessionStore.save(session);
    else sessionStore.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: 'pbl360.session' }));
  });
}

describe('AuthProvider across tabs', () => {
  it('switches to the account signed in on another tab', async () => {
    sessionStore.save(sessionFor(studentUser));
    renderApp('/turmas');
    expect(await screen.findByText('AS')).toBeInTheDocument();

    changeSessionInAnotherTab(sessionFor(tutorUser));

    expect(await screen.findByText('CO')).toBeInTheDocument();
    expect(
      screen.getByText('Você entrou com outra conta em outra aba. Esta aba agora usa essa conta.'),
    ).toBeInTheDocument();
  });

  it('signs out when another tab signs out', async () => {
    sessionStore.save(sessionFor(studentUser));
    renderApp('/turmas');
    expect(await screen.findByText('AS')).toBeInTheDocument();

    changeSessionInAnotherTab(null);

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByText('AS')).not.toBeInTheDocument();
  });

  it('ignores changes to unrelated storage keys', async () => {
    sessionStore.save(sessionFor(studentUser));
    renderApp('/turmas');
    expect(await screen.findByText('AS')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'outra-chave' }));
    });

    expect(screen.getByText('AS')).toBeInTheDocument();
  });
});
