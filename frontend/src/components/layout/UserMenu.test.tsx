import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { UserMenuButton } from './UserMenu';
import { ROUTES } from '@/routes/paths';
import type { UserResponse } from '@/types/auth';

const mockUser: UserResponse = {
  id: 'user-1',
  nome: 'Maria Silva',
  email: 'maria@uefs.br',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

describe('UserMenu', () => {
  it('renders Meu Perfil menu link pointing to /minha-conta without Em breve badge', async () => {
    const user = userEvent.setup();
    render(
      <AuthContext.Provider
        value={{
          user: mockUser,
          isAuthenticated: true,
          login: vi.fn(),
          logout: vi.fn(),
          updateUser: vi.fn(),
        }}
      >
        <MemoryRouter>
          <UserMenuButton user={mockUser} />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const button = screen.getByRole('button', { name: /abrir menu da conta/i });
    await user.click(button);

    const profileLink = screen.getByRole('link', { name: /meu perfil/i });
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute('href', ROUTES.myAccount);
    expect(profileLink).not.toHaveTextContent('Em breve');
  });
});
