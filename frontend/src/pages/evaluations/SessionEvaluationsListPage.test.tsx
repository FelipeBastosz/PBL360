import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { evaluationService } from '@/services/evaluation.service';
import type { UserResponse } from '@/types/auth';
import type { SessionEvaluationSummary, ProblemEvaluationCriteria } from '@/types/evaluation';
import SessionEvaluationListPage from './SessionEvaluationsListPage';

vi.mock('@/services/evaluation.service', () => ({
  evaluationService: {
    listBySession: vi.fn(),
    getProblemCriteria: vi.fn(),
  },
}));

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
});
