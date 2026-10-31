import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppHeader } from './AppHeader';
import { AuthContext } from '@/contexts/authContext';
import { ApiError } from '@/services/apiError';
import { sessionStore } from '@/services/sessionStore';
import { userService } from '@/services/user.service';
import { clearUserPhotoCache } from '@/hooks/useUserPhoto';
import { renderApp, sessionFor, studentUser } from '@/testing/renderApp';

vi.mock('@/services/user.service');
vi.mock('@/services/room.service', () => ({
  roomService: { list: async () => [], listMyRooms: async () => [] },
}));

describe('AppHeader', () => {
  afterEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    clearUserPhotoCache();
  });

  it('shows the photo stored for the signed-in student', async () => {
    vi.mocked(userService.getPhoto).mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    sessionStore.save(sessionFor({ ...studentUser, possuiFoto: true }));
    renderApp('/turmas');

    const photo = await screen.findByRole('img', { name: 'Foto de Ana Souza' });

    expect(photo.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    expect(userService.getPhoto).toHaveBeenCalledWith(studentUser.id);
  });

  it('shows the initials when the user has no photo', async () => {
    sessionStore.save(sessionFor({ ...studentUser, possuiFoto: false }));
    renderApp('/turmas');

    expect(await screen.findByText('AS')).toBeInTheDocument();
    expect(userService.getPhoto).not.toHaveBeenCalled();
  });

  it('falls back to the initials when the photo cannot be loaded', async () => {
    vi.mocked(userService.getPhoto).mockRejectedValue(new ApiError(404, ['Foto não encontrada.']));
    sessionStore.save(sessionFor({ ...studentUser, possuiFoto: true }));
    renderApp('/turmas');

    expect(await screen.findByText('AS')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Foto de Ana Souza' })).not.toBeInTheDocument();
  });

  it('signs the user out', async () => {
    sessionStore.save(sessionFor(studentUser));
    const { user } = renderApp('/turmas');

    await user.click(await screen.findByRole('button', { name: 'Abrir menu da conta' }));
    await user.click(screen.getByRole('button', { name: 'Sair da conta' }));

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(sessionStore.getToken()).toBeNull();
  });

  it('renders title, subtitle and back link instead of logo when provided', () => {
    render(
      <AuthContext.Provider
        value={{
          user: null,
          isAuthenticated: false,
          login: vi.fn(),
          logout: vi.fn(),
        }}
      >
        <MemoryRouter>
          <AppHeader
            title="Problema 1 - Prontuário Eletrônico"
            subtitle="Turma A"
            backUrl="/turmas/room-1/problemas/prob-1/sessoes/sess-1"
          />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Problema 1 - Prontuário Eletrônico',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Turma A')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar para a sessão/i })).toHaveAttribute(
      'href',
      '/turmas/room-1/problemas/prob-1/sessoes/sess-1',
    );
  });
});
