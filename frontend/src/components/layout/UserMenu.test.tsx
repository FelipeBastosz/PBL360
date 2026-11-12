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

function renderUserMenu() {
  return render(
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
}

describe('UserMenu', () => {
  it('renders Meu Perfil menu link pointing to /minha-conta without Em breve badge', async () => {
    const user = userEvent.setup();
    renderUserMenu();

    await user.click(screen.getByRole('button', { name: /abrir menu da conta/i }));

    const profileLink = screen.getByRole('link', { name: /meu perfil/i });
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute('href', ROUTES.myAccount);
    expect(profileLink).not.toHaveTextContent('Em breve');
  });

  it('renders Informações adicionais button and opens popup with logo and legal links', async () => {
    const user = userEvent.setup();
    renderUserMenu();

    await user.click(screen.getByRole('button', { name: /abrir menu da conta/i }));

    const infoButton = screen.getByRole('button', { name: /informações adicionais/i });
    expect(infoButton).toBeInTheDocument();

    await user.click(infoButton);

    expect(screen.getByRole('heading', { name: 'Informações adicionais' })).toBeInTheDocument();
    expect(screen.getByLabelText('PBL360')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Termos de Uso' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Política de Privacidade' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Termos de Uso' }));
    expect(screen.getByRole('heading', { name: 'Termos de Uso' })).toBeInTheDocument();
    expect(screen.getByText('Termos e Politica em desenvolvimento')).toBeInTheDocument();
  });
});
