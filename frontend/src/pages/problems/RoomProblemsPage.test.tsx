import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { ApiError } from '@/services/apiError';
import { roomService } from '@/services/room.service';
import { problemService } from '@/services/problem.service';
import type { UserResponse } from '@/types/auth';
import type { Room } from '@/types/room';
import RoomProblemsPage from './RoomProblemsPage';

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    notify: vi.fn(),
  }),
}));

vi.mock('@/services/room.service', () => ({
  roomService: {
    getById: vi.fn(),
  },
}));

vi.mock('@/services/problem.service', () => ({
  problemService: {
    list: vi.fn(),
  },
}));

const mockTeacher: UserResponse = {
  id: '1',
  nome: 'Professor Fulano',
  email: 'prof@test.com',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

const mockStudent: UserResponse = {
  id: '2',
  nome: 'Aluno Ciclano',
  email: 'aluno@test.com',
  tipo: 'ALUNO',
  matricula: '123456',
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

const mockRoom: Room = {
  id: 'room-1',
  nome: 'MI - Algoritmos - TP02',
  codigoDisciplina: 'EXA801',
  codigoSala: 'aB7kP2x9',
  semestre: '2026.2',
  ativo: true,
  criadoEm: '2026-01-01T00:00:00.000Z',
  professorResponsavelId: '1',
};

function renderComponent(user: UserResponse = mockTeacher) {
  return render(
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={['/turmas/room-1/problemas']}>
        <Routes>
          <Route path="/turmas/:id/problemas" element={<RoomProblemsPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('RoomProblemsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomService.getById).mockResolvedValue(mockRoom);
    vi.mocked(problemService.list).mockResolvedValue([]);
  });

  describe('when user is a professor', () => {
    it('renders header, top action cards, empty state and fab menu', async () => {
      renderComponent(mockTeacher);

      expect(await screen.findByText('MI - Algoritmos')).toBeInTheDocument();
      expect(screen.getByText('TP02')).toBeInTheDocument();

      expect(screen.getByRole('button', { name: /relatório final/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /participantes da turma/i })).toBeInTheDocument();
      expect(screen.getByText('Nenhum problema cadastrado nesta turma.')).toBeInTheDocument();

      const fab = screen.getByRole('button', { name: /ações de problema/i });
      expect(fab).toBeInTheDocument();

      await userEvent.click(fab);
      expect(screen.getByRole('button', { name: 'Criar novo problema' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Editar um problema' })).toBeInTheDocument();
    });
    it('renders problem cards when room has problems', async () => {
      const mockProblems = [
        {
          id: 'prob-1',
          salaId: 'room-1',
          titulo: 'Problema 1 - Introdução',
          descricao: null,
          ordem: 1,
          dataInicio: null,
          dataFim: null,
          tabelaId: null,
          autoavaliacaoLiberada: true,
          avaliacaoEntreParesLiberada: false,
          liberadoEm: null,
          prazoAutoavaliacao: null,
          criadoPor: 'tutor-1',
          criadoEm: '2026-01-01',
          atualizadoEm: '2026-01-01',
        },
      ];
      vi.mocked(problemService.list).mockResolvedValue(mockProblems);

      renderComponent(mockTeacher);

      expect(await screen.findByText('Problema 1 - Introdução')).toBeInTheDocument();
      expect(screen.getByText('Autoavaliação disponível')).toBeInTheDocument();

      expect(screen.queryByText('Nenhum problema cadastrado nesta turma.')).not.toBeInTheDocument();
    });
  });

  describe('when user is a student', () => {
    it('does not render Relatório Final card nor fab menu', async () => {
      renderComponent(mockStudent);

      expect(await screen.findByText('MI - Algoritmos')).toBeInTheDocument();

      expect(screen.getByRole('link', { name: /participantes da turma/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /relatório final/i })).not.toBeInTheDocument();

      expect(
        screen.getByText('Nenhum problema disponível nesta turma no momento.'),
      ).toBeInTheDocument();

      expect(screen.queryByRole('button', { name: /ações de problema/i })).not.toBeInTheDocument();
    });
  });

  describe('when the room cannot be opened', () => {
    it('shows only the access notice and a way back to the rooms', async () => {
      vi.mocked(roomService.getById).mockRejectedValue(
        new ApiError(403, ['Acesso negado para o seu perfil de usuário.']),
      );
      renderComponent(mockStudent);

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Acesso negado para o seu perfil de usuário.',
      );
      expect(screen.getByRole('link', { name: 'Ver minhas turmas' })).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Pesquisar problema')).not.toBeInTheDocument();
      expect(screen.queryByText(/Nenhum problema disponível/)).not.toBeInTheDocument();
    });
  });
});
