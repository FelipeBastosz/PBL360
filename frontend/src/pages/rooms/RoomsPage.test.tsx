import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RoomsPage from './RoomsPage';
import { AuthContext } from '@/contexts/authContext';
import type { UserResponse } from '@/types/auth';

const mockTeacher: UserResponse = {
  id: '1',
  nome: 'Professor Fulano',
  email: 'prof@test.com',
  tipo: 'PROFESSOR',
  matricula: null,
  fotoUrl: null,
  ativo: true,
  criadoEm: '2026-01-01',
};

const mockStudent: UserResponse = {
  id: '2',
  nome: 'Aluno Ciclano',
  email: 'aluno@test.com',
  tipo: 'ALUNO',
  matricula: '123456',
  fotoUrl: null,
  ativo: true,
  criadoEm: '2026-01-01',
};

function renderWithUser(user: UserResponse = mockTeacher) {
  return render(
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <MemoryRouter>
        <RoomsPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('RoomsPage', () => {
  describe('common behaviors', () => {
    it('renders the header and search input', () => {
      renderWithUser();

      expect(screen.getByText('PF')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Pesquisar turma')).toBeInTheDocument();
      expect(screen.getByText('Minhas turmas · 0')).toBeInTheDocument();
    });

    it('allows typing in search input without side effects', async () => {
      renderWithUser();

      const input = screen.getByPlaceholderText('Pesquisar turma');
      await userEvent.type(input, 'Matemática');

      expect(input).toHaveValue('Matemática');
    });
  });

  describe('when user is a teacher', () => {
    it('renders the teacher empty state title and subtitle', () => {
      renderWithUser(mockTeacher);

      expect(screen.getByText('Você ainda não possui turmas cadastradas.')).toBeInTheDocument();
      expect(screen.getByText(/para começar/i)).toBeInTheDocument();
    });

    it('shows creation and edit actions in fab menu', async () => {
      renderWithUser(mockTeacher);

      const fab = screen.getByRole('button', { name: /ações de turma/i });
      await userEvent.click(fab);

      expect(screen.getByRole('button', { name: 'Criar nova turma' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Editar uma turma' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Entrar em uma turma' })).not.toBeInTheDocument();
    });
  });

  describe('when user is a student', () => {
    it('renders the student empty state title and subtitle', () => {
      renderWithUser(mockStudent);

      expect(screen.getByText('Você ainda não faz parte de nenhuma turma.')).toBeInTheDocument();
      expect(screen.getByText(/para começar/i)).toBeInTheDocument();
    });

    it('shows only the join room action in fab menu', async () => {
      renderWithUser(mockStudent);

      const fab = screen.getByRole('button', { name: /ações de turma/i });
      await userEvent.click(fab);

      expect(screen.getByRole('button', { name: 'Entrar em uma turma' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Criar nova turma' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Editar uma turma' })).not.toBeInTheDocument();
    });
  });
});
