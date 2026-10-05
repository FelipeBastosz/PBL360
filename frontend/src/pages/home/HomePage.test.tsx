import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { sessionStore } from '@/services/sessionStore';
import { userService } from '@/services/user.service';
import { renderApp, sessionFor, studentUser, tutorUser } from '@/testing/renderApp';

vi.mock('@/services/user.service');

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

describe('HomePage', () => {
  it('shows the photo stored for the signed-in student', async () => {
    vi.mocked(userService.getPhoto).mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    sessionStore.save(sessionFor({ ...studentUser, possuiFoto: true }));
    renderApp('/inicio');

    const photo = await screen.findByRole('img', { name: 'Foto de Ana Souza' });

    expect(photo.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    expect(userService.getPhoto).toHaveBeenCalledWith(studentUser.id);
  });

  it('shows the initials when the user has no photo', async () => {
    sessionStore.save(sessionFor({ ...studentUser, possuiFoto: false }));
    renderApp('/inicio');

    expect(await screen.findByRole('heading', { name: 'Olá, Ana Souza!' })).toBeInTheDocument();
    expect(screen.getByText('AS')).toBeInTheDocument();
    expect(userService.getPhoto).not.toHaveBeenCalled();
  });

  it('falls back to the initials when the photo cannot be loaded', async () => {
    vi.mocked(userService.getPhoto).mockRejectedValue(new ApiError(404, ['Foto não encontrada.']));
    sessionStore.save(sessionFor({ ...studentUser, possuiFoto: true }));
    renderApp('/inicio');

    expect(await screen.findByText('AS')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Foto de Ana Souza' })).not.toBeInTheDocument();
  });

  it('shows the formulas button only for tutors', async () => {
    sessionStore.save(sessionFor(tutorUser));
    renderApp('/inicio');

    expect(await screen.findByRole('button', { name: 'Ver Minhas Fórmulas' })).toBeInTheDocument();
  });

  it('does not show the formulas button for students', async () => {
    sessionStore.save(sessionFor(studentUser));
    renderApp('/inicio');

    expect(
      await screen.findByRole('heading', { name: `Olá, ${studentUser.nome}!` }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ver Minhas Fórmulas' })).not.toBeInTheDocument();
  });
});
