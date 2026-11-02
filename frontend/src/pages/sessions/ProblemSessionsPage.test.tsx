import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { roomService } from '@/services/room.service';
import { problemService } from '@/services/problem.service';
import { sessionService } from '@/services/session.service';
import type { UserResponse } from '@/types/auth';
import type { Room } from '@/types/room';
import type { Problem } from '@/types/problem';
import type { Session } from '@/types/session';
import ProblemSessionsPage from './ProblemSessionsPage';

vi.mock('@/services/room.service', () => ({
  roomService: { getById: vi.fn(), listMyRooms: vi.fn() },
}));
vi.mock('@/services/problem.service', () => ({
  problemService: { getById: vi.fn(), list: vi.fn() },
}));
vi.mock('@/services/session.service', () => ({
  sessionService: { list: vi.fn(), listForRoom: vi.fn() },
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: vi.fn() }),
}));

const mockTeacher: UserResponse = {
  id: '1',
  nome: 'Professor Silva',
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
  criadoEm: '2026-01-01',
  professorResponsavelId: '1',
};

const mockProblem: Problem = {
  id: 'prob-1',
  salaId: 'room-1',
  titulo: 'Problema 01',
  descricao: null,
  ordem: 1,
  dataInicio: null,
  dataFim: null,
  tabelaId: null,
  autoavaliacaoLiberada: false,
  avaliacaoEntreParesLiberada: false,
  liberadoEm: null,
  prazoAutoavaliacao: null,
  criadoPor: 'tutor-1',
  criadoEm: '2026-01-01',
  atualizadoEm: '2026-01-01',
};

const mockSessions: Session[] = [
  {
    id: 'sess-1',
    titulo: 'Primeira sessão',
    descricao: 'Discussão do problema',
    data: '12-08-2026', // Formato DD-MM-AAAA
    ordem: 1,
    status: 'agendada',
  },
];

function renderPage(user: UserResponse = mockTeacher) {
  return render(
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={['/turmas/room-1/problemas/prob-1']}>
        <Routes>
          <Route path="/turmas/:roomId/problemas/:problemId" element={<ProblemSessionsPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('ProblemSessionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomService.getById).mockResolvedValue(mockRoom);
    vi.mocked(problemService.getById).mockResolvedValue(mockProblem);
    vi.mocked(sessionService.list).mockResolvedValue([]);
  });

  describe('when user is a professor', () => {
    it('renders problem header, Relatório Final, Fórmulas cards and empty state', async () => {
      renderPage(mockTeacher);

      expect(await screen.findByText('Problema 01')).toBeInTheDocument();
      expect(screen.getByText('TP02')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /relatório final/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fórmulas/i })).toBeInTheDocument();
      expect(screen.getByText('Nenhuma sessão cadastrada neste problema.')).toBeInTheDocument();

      const fab = screen.getByRole('button', { name: /ações da sessão/i });
      expect(fab).toBeInTheDocument();

      await userEvent.click(fab);
      expect(screen.getByRole('button', { name: 'Criar nova sessão' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Editar uma sessão' })).toBeInTheDocument();
    });

    it('renders session cards when sessions exist', async () => {
      vi.mocked(sessionService.list).mockResolvedValue(mockSessions);
      renderPage(mockTeacher);

      expect(await screen.findByText(/Primeira sessão · 12 ago/i)).toBeInTheDocument();
      expect(screen.getByText('Discussão do problema')).toBeInTheDocument();
    });
  });

  describe('when user is a student', () => {
    beforeEach(() => {
      vi.mocked(roomService.listMyRooms).mockResolvedValue([
        { salaId: 'room-1', nome: 'MI - Algoritmos - TP02', semestre: '2026.2', totalAlunos: 3 },
      ]);
      vi.mocked(problemService.list).mockResolvedValue([mockProblem]);
      vi.mocked(sessionService.listForRoom).mockResolvedValue([]);
    });

    it('does not render Relatório Final nor fab menu', async () => {
      renderPage(mockStudent);

      expect(await screen.findByText('Problema 01')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /relatório final/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /fórmulas/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /ações da sessão/i })).not.toBeInTheDocument();
      expect(
        screen.getByText('Nenhuma sessão disponível neste problema no momento.'),
      ).toBeInTheDocument();
    });

    it('lists the sessions of the problem through the student routes', async () => {
      vi.mocked(sessionService.listForRoom).mockResolvedValue([
        {
          id: 'sess-1',
          titulo: 'Primeira sessão',
          data: '12-08-2026', // Formato DD-MM-AAAA
          ordem: 1,
          status: 'agendada',
          problemaId: 'prob-1',
          problemaTitulo: 'Problema 01',
        },
        {
          id: 'sess-9',
          titulo: 'Sessão de outro problema',
          data: '13-08-2026', // Formato DD-MM-AAAA
          ordem: 1,
          status: 'agendada',
          problemaId: 'prob-2',
          problemaTitulo: 'Problema 02',
        },
      ]);
      renderPage(mockStudent);

      expect(await screen.findByText(/Primeira sessão · 12 ago/i)).toBeInTheDocument();
      expect(screen.getByText('TP02')).toBeInTheDocument();
      expect(screen.queryByText(/Sessão de outro problema/)).not.toBeInTheDocument();
      expect(roomService.getById).not.toHaveBeenCalled();
      expect(problemService.getById).not.toHaveBeenCalled();
      expect(sessionService.list).not.toHaveBeenCalled();
    });
  });
});
