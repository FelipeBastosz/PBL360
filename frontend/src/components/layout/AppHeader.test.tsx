import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { sessionStore } from '@/services/sessionStore';
import { userService } from '@/services/user.service';
import { clearUserPhotoCache } from '@/hooks/useUserPhoto';
import { renderApp, sessionFor, studentUser } from '@/testing/renderApp';

vi.mock('@/services/user.service');
vi.mock('@/services/room.service', () => ({
  roomService: { list: async () => [], listMyRooms: async () => [] },
}));

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  clearUserPhotoCache();
});

describe('AppHeader', () => {
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
});
