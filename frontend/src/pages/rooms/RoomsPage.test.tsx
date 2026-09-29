import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RoomsPage from './RoomsPage';
import { AuthContext } from '@/contexts/authContext';
import { roomService } from '@/services/room.service';
import type { UserResponse } from '@/types/auth';
import type { Room } from '@/types/room';

vi.mock('@/services/room.service', () => ({
  roomService: {
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

const mockRooms: Room[] = [
  {
    id: 'room-1',
    nome: 'MI - Engenharia de Software · TP01',
    codigoDisciplina: 'EXA863',
    codigoSala: 'aB7kP2x9',
    semestre: '2026.2',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    professorResponsavelId: '1',
  },
  {
    id: 'room-2',
    nome: 'MI - Algoritmos · TP02',
    codigoDisciplina: 'EXA801',
    codigoSala: 'xY9zW1a2',
    semestre: '2026.2',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    professorResponsavelId: '1',
  },
];

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
    </AuthContext.Provider>,
  );
}

describe('RoomsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomService.list).mockResolvedValue([]);
  });

  describe('common behaviors', () => {
    it('renders the header and search input', async () => {
      renderWithUser();

      expect(screen.getByText('PF')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Pesquisar turma')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Minhas turmas · 0')).toBeInTheDocument();
      });
    });

    it('allows typing in search input and filters the room list', async () => {
      vi.mocked(roomService.list).mockResolvedValue(mockRooms);
      renderWithUser();

      expect(await screen.findByText('MI - Engenharia de Software · TP01')).toBeInTheDocument();
      expect(screen.getByText('MI - Algoritmos · TP02')).toBeInTheDocument();

      const input = screen.getByPlaceholderText('Pesquisar turma');
      await userEvent.type(input, 'Software');

      expect(screen.getByText('MI - Engenharia de Software · TP01')).toBeInTheDocument();
      expect(screen.queryByText('MI - Algoritmos · TP02')).not.toBeInTheDocument();
      expect(screen.getByText('Minhas turmas · 1')).toBeInTheDocument();
    });

    it('shows message when search filter has no matches', async () => {
      vi.mocked(roomService.list).mockResolvedValue(mockRooms);
      renderWithUser();

      expect(await screen.findByText('MI - Engenharia de Software · TP01')).toBeInTheDocument();

      const input = screen.getByPlaceholderText('Pesquisar turma');
      await userEvent.type(input, 'Inexistente');

      expect(screen.getByText('Nenhuma turma encontrada.')).toBeInTheDocument();
      expect(screen.getByText('Minhas turmas · 0')).toBeInTheDocument();
    });

    it('displays error alert when API call fails', async () => {
      vi.mocked(roomService.list).mockRejectedValue(new Error('Erro de conexão'));
      renderWithUser();

      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('when user is a teacher', () => {
    it('renders the teacher empty state title and subtitle when has no rooms', async () => {
      renderWithUser(mockTeacher);

      expect(
        await screen.findByText('Você ainda não possui turmas cadastradas.'),
      ).toBeInTheDocument();
      expect(screen.getByText(/para começar/i)).toBeInTheDocument();
    });

    it('renders room cards with teacher name when rooms exist', async () => {
      vi.mocked(roomService.list).mockResolvedValue(mockRooms);
      renderWithUser(mockTeacher);

      expect(await screen.findByText('MI - Engenharia de Software · TP01')).toBeInTheDocument();
      expect(screen.getAllByText('Prof. Professor Fulano')).toHaveLength(2);
      expect(screen.getAllByText('0 alunos')).toHaveLength(2);
      expect(screen.getAllByText('0 problemas')).toHaveLength(2);
    });

    it('shows creation and edit actions in fab menu', async () => {
      renderWithUser(mockTeacher);

      const fab = screen.getByRole('button', { name: /ações de turma/i });
      await userEvent.click(fab);

      expect(screen.getByRole('link', { name: 'Criar nova turma' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Editar uma turma' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Entrar em uma turma' })).not.toBeInTheDocument();
    });
  });

  describe('when user is a student', () => {
    it('renders the student empty state title and subtitle when has no rooms', async () => {
      renderWithUser(mockStudent);

      expect(
        await screen.findByText('Você ainda não faz parte de nenhuma turma.'),
      ).toBeInTheDocument();
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
