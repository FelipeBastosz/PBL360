import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/testing/renderApp';

vi.mock('@/services/auth.service');
vi.mock('@/services/room.service', () => ({
  roomService: { list: async () => [], listMyRooms: async () => [] },
}));

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

describe('ProfileSelectionPage', () => {
  it('renders registration title and instructions', async () => {
    renderApp('/perfil');

    expect(
      await screen.findByRole('heading', { name: 'Como você deseja se cadastrar?' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Escolha seu perfil para iniciar o cadastro na plataforma.'),
    ).toBeInTheDocument();
  });

  it('links to student registration form when selecting Aluno', async () => {
    renderApp('/perfil');

    const studentOption = await screen.findByRole('link', { name: /Aluno/ });
    expect(studentOption).toHaveAttribute('href', '/cadastro?perfil=aluno');
  });

  it('links to professor registration form when selecting Professor', async () => {
    renderApp('/perfil');

    const professorOption = await screen.findByRole('link', { name: /Professor/ });
    expect(professorOption).toHaveAttribute('href', '/cadastro?perfil=professor');
  });

  it('provides a link back to login for users with existing accounts', async () => {
    renderApp('/perfil');

    const loginLink = await screen.findByRole('link', { name: 'Entrar' });
    expect(loginLink).toHaveAttribute('href', '/entrar');
  });
});
