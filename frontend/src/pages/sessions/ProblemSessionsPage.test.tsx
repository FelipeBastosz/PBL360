import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { roomService } from '@/services/room.service';
import { problemService } from '@/services/problem.service';
import { sessionService } from '@/services/session.service';
import { feedbackService } from '@/services/feedback.service';
import { gradesService } from '@/services/grades.service';
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
vi.mock('@/services/feedback.service', () => ({
  feedbackService: {
    getProblemFeedbacks: vi.fn(),
    saveGeneralFeedback: vi.fn(),
  },
}));
vi.mock('@/services/grades.service', () => ({
  gradesService: { getProblemGrades: vi.fn() },
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
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
    data: '12-08-2026',
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
    vi.mocked(feedbackService.getProblemFeedbacks).mockResolvedValue({
      geral: null,
      alunos: [],
    });
  });

  describe('when user is a professor', () => {
    it('renders problem header, Relatório Final, Fórmulas, Feedback Geral cards and empty state', async () => {
      renderPage(mockTeacher);

      expect(await screen.findByText('Problema 01')).toBeInTheDocument();
      expect(screen.getByText('TP02')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /relatório final/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fórmulas/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /feedback geral/i })).toBeInTheDocument();
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

    it('allows professor to create first general feedback without touching grades', async () => {
      const user = userEvent.setup();
      vi.mocked(feedbackService.saveGeneralFeedback).mockResolvedValue({
        id: 'fb-gen-new',
        escopo: 'PROBLEMA',
        texto: 'Excelente trabalho coletivo na investigação do problema.',
        criadoEm: '2026-10-10T10:00:00Z',
        editadoEm: null,
      });

      renderPage(mockTeacher);

      const feedbackCard = await screen.findByRole('button', { name: /feedback geral/i });
      await user.click(feedbackCard);

      const dialog = screen.getByRole('dialog', { name: 'Feedback Geral da Turma' });
      const textarea = screen.getByLabelText(/comentário geral/i);
      await user.type(textarea, 'Excelente trabalho coletivo na investigação do problema.');
      await user.click(screen.getByRole('button', { name: 'Salvar' }));

      await waitFor(() => {
        expect(dialog).not.toBeInTheDocument();
      });

      expect(feedbackService.saveGeneralFeedback).toHaveBeenCalledWith('room-1', 'prob-1', {
        texto: 'Excelente trabalho coletivo na investigação do problema.',
      });
      expect(gradesService.getProblemGrades).not.toHaveBeenCalled();
      expect(mockNotify).toHaveBeenCalledWith({
        tone: 'success',
        message: 'Feedback geral salvo com sucesso!',
      });
      expect(screen.getByText('Feedback registrado')).toBeInTheDocument();
    });

    it('loads existing general feedback, edits it, and supports canceling unsaved changes', async () => {
      const user = userEvent.setup();
      vi.mocked(feedbackService.getProblemFeedbacks).mockResolvedValue({
        geral: {
          id: 'fb-gen-1',
          escopo: 'PROBLEMA',
          texto: 'Feedback inicial salvo.',
          criadoEm: '2026-10-01T10:00:00Z',
          editadoEm: '2026-10-02T14:00:00Z',
        },
        alunos: [],
      });
      vi.mocked(feedbackService.saveGeneralFeedback).mockResolvedValue({
        id: 'fb-gen-1',
        escopo: 'PROBLEMA',
        texto: 'Feedback revisado com sucesso.',
        criadoEm: '2026-10-01T10:00:00Z',
        editadoEm: '2026-10-03T16:00:00Z',
      });

      renderPage(mockTeacher);

      expect(await screen.findByText('Feedback registrado')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /feedback geral/i }));
      const textarea = screen.getByLabelText(/comentário geral/i);
      expect(textarea).toHaveValue('Feedback inicial salvo.');

      await user.type(textarea, ' Texto que será cancelado.');
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(feedbackService.saveGeneralFeedback).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: /feedback geral/i }));
      const reopenedTextarea = screen.getByLabelText(/comentário geral/i);
      expect(reopenedTextarea).toHaveValue('Feedback inicial salvo.');

      await user.clear(reopenedTextarea);
      await user.type(reopenedTextarea, 'Feedback revisado com sucesso.');
      await user.click(screen.getByRole('button', { name: 'Salvar' }));

      await waitFor(() => {
        expect(
          screen.queryByRole('dialog', { name: 'Feedback Geral da Turma' }),
        ).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /feedback geral/i }));
      expect(screen.getByLabelText(/comentário geral/i)).toHaveValue(
        'Feedback revisado com sucesso.',
      );
    });

    it('clears existing general feedback to 0 characters and restores default card subtitle', async () => {
      const user = userEvent.setup();
      vi.mocked(feedbackService.getProblemFeedbacks).mockResolvedValue({
        geral: {
          id: 'fb-gen-1',
          escopo: 'PROBLEMA',
          texto: 'Parecer salvo da turma.',
          criadoEm: '2026-10-01T10:00:00Z',
          editadoEm: null,
        },
        alunos: [],
      });
      vi.mocked(feedbackService.saveGeneralFeedback).mockResolvedValue(null);

      renderPage(mockTeacher);

      expect(await screen.findByText('Feedback registrado')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /feedback geral/i }));
      const textarea = screen.getByLabelText(/comentário geral/i);
      await user.clear(textarea);
      await user.click(screen.getByRole('button', { name: 'Salvar' }));

      await waitFor(() => {
        expect(
          screen.queryByRole('dialog', { name: 'Feedback Geral da Turma' }),
        ).not.toBeInTheDocument();
      });

      expect(feedbackService.saveGeneralFeedback).toHaveBeenCalledWith('room-1', 'prob-1', {
        texto: '',
      });
      expect(gradesService.getProblemGrades).not.toHaveBeenCalled();
      expect(screen.getByText('Parecer geral da turma')).toBeInTheDocument();
      expect(screen.queryByText('Feedback registrado')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /feedback geral/i }));
      expect(screen.getByLabelText(/comentário geral/i)).toHaveValue('');
    });

    it('preserves typed text on save error in ProblemSessionsPage', async () => {
      const user = userEvent.setup();
      vi.mocked(feedbackService.saveGeneralFeedback).mockRejectedValue(
        new Error('Erro de conexão ao salvar feedback.'),
      );

      renderPage(mockTeacher);

      await user.click(await screen.findByRole('button', { name: /feedback geral/i }));
      const textarea = screen.getByLabelText(/comentário geral/i);
      await user.type(textarea, 'Rascunho importante da turma.');
      await user.click(screen.getByRole('button', { name: 'Salvar' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Erro de conexão ao salvar feedback.',
      );
      expect(textarea).toHaveValue('Rascunho importante da turma.');
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

    it('does not render Relatório Final, Feedback Geral editor nor fab menu and does not fetch professor feedbacks', async () => {
      renderPage(mockStudent);

      expect(await screen.findByText('Problema 01')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /relatório final/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /fórmulas/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /feedback geral/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /ações da sessão/i })).not.toBeInTheDocument();
      expect(feedbackService.getProblemFeedbacks).not.toHaveBeenCalled();
      expect(
        screen.getByText('Nenhuma sessão disponível neste problema no momento.'),
      ).toBeInTheDocument();
    });

    it('lists the sessions of the problem through the student routes', async () => {
      vi.mocked(sessionService.listForRoom).mockResolvedValue([
        {
          id: 'sess-1',
          titulo: 'Primeira sessão',
          data: '12-08-2026',
          ordem: 1,
          status: 'agendada',
          problemaId: 'prob-1',
          problemaTitulo: 'Problema 01',
        },
        {
          id: 'sess-9',
          titulo: 'Sessão de outro problema',
          data: '13-08-2026',
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
