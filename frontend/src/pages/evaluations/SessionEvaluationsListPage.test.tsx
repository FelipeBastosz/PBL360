import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { evaluationService } from '@/services/evaluation.service';
import { gradesService } from '@/services/grades.service';
import { usePokerChannel, type PokerChannelHandlers } from '@/hooks/usePokerChannel';
import type { ProblemGradesResponse, StudentSessionGrade } from '@/types/grades';
import type { UserResponse } from '@/types/auth';
import type { SessionEvaluationSummary, ProblemEvaluationCriteria } from '@/types/evaluation';
import SessionEvaluationListPage from './SessionEvaluationsListPage';

vi.mock('@/services/evaluation.service', () => ({
  evaluationService: {
    listBySession: vi.fn(),
    getProblemCriteria: vi.fn(),
  },
}));

vi.mock('@/services/grades.service', () => ({
  gradesService: { getProblemGrades: vi.fn() },
}));

vi.mock('@/hooks/usePokerChannel', () => ({ usePokerChannel: vi.fn(() => 'live') }));

const pokerSession = (nota: number | null): StudentSessionGrade => ({
  sessaoId: 'sess-1',
  nota,
  situacao: nota === null ? 'PENDENTE' : 'AVALIADA',
  modalidade: 'PARES',
  pares: {
    nota,
    situacao: nota === null ? 'SEM_AVALIACOES' : 'AVALIADA',
    origem: 'PLANNING_POKER',
  },
});

const gradesWithAna = (session: StudentSessionGrade): ProblemGradesResponse => ({
  sessoes: [],
  alunos: [
    { alunoId: 'aluno-1', nome: 'Ana Souza', matricula: null, sessoes: [session], notaFinal: null },
  ],
  mediaTurma: null,
  versoesFormula: { sessao: null, problema: null },
});

const mockTeacher: UserResponse = {
  id: 'tutor-1',
  nome: 'Professor Silva',
  email: 'prof@test.com',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

const mockStudents: SessionEvaluationSummary[] = [
  {
    alunoId: 'aluno-1',
    nome: 'Ana Souza',
    iniciais: 'AS',
    presenca: null,
    status: 'PENDENTE',
    notaSessao: null,
  },
  {
    alunoId: 'aluno-2',
    nome: 'João Silva',
    iniciais: 'JS',
    presenca: null,
    status: 'ENVIADA',
    notaSessao: 8.5,
  },
];

const mockCriteria: ProblemEvaluationCriteria = {
  tabela: { id: 'tab-1', nome: 'Critérios Tutoriais' },
  criterios: [{ id: 'crit-1', nome: 'Participação', peso: 1, notaMaxima: 10, ordem: 1 }],
};

function renderPage() {
  return render(
    <AuthContext.Provider
      value={{
        user: mockTeacher,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={['/turmas/room-1/problemas/prob-1/sessoes/sess-1/avaliar']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId/avaliar"
            element={<SessionEvaluationListPage />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('SessionEvaluationListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(gradesService.getProblemGrades).mockResolvedValue({
      sessoes: [],
      alunos: [],
      mediaTurma: null,
      versoesFormula: { sessao: null, problema: null },
    });
  });

  it('renders student list successfully when problem has evaluation table', async () => {
    vi.mocked(evaluationService.listBySession).mockResolvedValue(mockStudents);
    vi.mocked(evaluationService.getProblemCriteria).mockResolvedValue(mockCriteria);

    renderPage();

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();

    expect(screen.queryByText(/problema sem tabela vinculada/i)).not.toBeInTheDocument();
  });

  it('renders missing criteria alert and disables buttons when problem has no table (Decisão 4)', async () => {
    vi.mocked(evaluationService.listBySession).mockResolvedValue(mockStudents);
    vi.mocked(evaluationService.getProblemCriteria).mockRejectedValue(new Error('Sem tabela'));

    renderPage();

    expect(await screen.findByText('Problema sem tabela vinculada')).toBeInTheDocument();

    const formulasLink = screen.getByRole('link', { name: 'Configurar Fórmulas' });
    expect(formulasLink).toBeInTheDocument();
    expect(formulasLink).toHaveAttribute(
      'href',
      '/turmas/room-1/problemas/prob-1/sessoes/sess-1/formulas',
    );

    const buttons = screen.getAllByRole('button', { name: 'Avaliar' });
    expect(buttons[0]).toBeDisabled();
  });

  it('shows the student decided in the planning poker as evaluated with the grade', async () => {
    vi.mocked(evaluationService.listBySession).mockResolvedValue(mockStudents);
    vi.mocked(evaluationService.getProblemCriteria).mockResolvedValue(mockCriteria);
    vi.mocked(gradesService.getProblemGrades).mockResolvedValue(gradesWithAna(pokerSession(8.8)));

    renderPage();

    expect(await screen.findByText('Avaliada · 8,8')).toBeInTheDocument();
    expect(screen.queryByText('Pendente')).not.toBeInTheDocument();
    expect(gradesService.getProblemGrades).toHaveBeenCalledWith('room-1', 'prob-1');
  });

  it('updates the card when the tutor decides the round in real time', async () => {
    vi.mocked(evaluationService.listBySession).mockResolvedValue(mockStudents);
    vi.mocked(evaluationService.getProblemCriteria).mockResolvedValue(mockCriteria);
    vi.mocked(gradesService.getProblemGrades)
      .mockResolvedValueOnce(gradesWithAna(pokerSession(null)))
      .mockResolvedValueOnce(gradesWithAna(pokerSession(7.5)));

    renderPage();
    expect(await screen.findByText('Pendente')).toBeInTheDocument();

    const handlers = vi.mocked(usePokerChannel).mock.calls.at(-1)![2] as PokerChannelHandlers;
    expect(vi.mocked(usePokerChannel).mock.calls.at(-1)![1]).toBe(true);
    act(() => handlers.onEvent('poker.decidida', {}));

    expect(await screen.findByText('Avaliada · 7,5')).toBeInTheDocument();
  });
});
