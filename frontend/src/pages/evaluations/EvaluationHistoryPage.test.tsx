import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EvaluationHistoryPage from './EvaluationHistoryPage';
import { evaluationService } from '@/services/evaluation.service';
import type { StudentEvaluationHistoryItem } from '@/types/evaluation';

vi.mock('@/services/evaluation.service', () => ({
  evaluationService: {
    getEvaluationHistory: vi.fn(),
    listBySession: vi.fn(),
    adjustSelfAssessment: vi.fn(),
  },
}));

vi.mock('@/services/room.service', () => ({
  roomService: {
    listStudents: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'prof-1', nome: 'Professor Fernando', tipo: 'PROFESSOR' },
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: vi.fn() }),
}));

const mockStudents: StudentEvaluationHistoryItem[] = [
  {
    alunoId: 'student-1',
    nome: 'Elisa Nunes',
    matricula: '26121194',
    notaAluno: 8.0,
    notaAlunoOriginal: null,
    notaTutor: null,
    notaPares: null,
    avaliacoesPares: 0,
    situacaoAjuste: 'SEM_AJUSTE',
  },
  {
    alunoId: 'student-2',
    nome: 'Carla Rocha',
    matricula: '26121192',
    notaAluno: 8.5,
    notaAlunoOriginal: 9.5,
    notaTutor: 8.5,
    notaPares: null,
    avaliacoesPares: 0,
    situacaoAjuste: 'AJUSTADA',
  },
];

function renderHistoryPage() {
  return render(
    <MemoryRouter initialEntries={['/turmas/room-1/problemas/prob-1/sessoes/sess-1/historico']}>
      <Routes>
        <Route
          path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId/historico"
          element={<EvaluationHistoryPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EvaluationHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(evaluationService.getEvaluationHistory).mockResolvedValue({
      alunos: mockStudents,
    });
  });

  it('renders student list with comparison scores and initial adjustment statuses', async () => {
    renderHistoryPage();

    expect(await screen.findByText('Elisa Nunes')).toBeInTheDocument();
    expect(screen.getByText('Carla Rocha')).toBeInTheDocument();
    expect(screen.getByText('Sem ajuste do tutor')).toBeInTheDocument();
    expect(screen.getByText('Ajustada com justificativa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar em PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar em Excel' })).toBeInTheDocument();
  });

  it('toggles name visibility to display matriculas instead of names', async () => {
    renderHistoryPage();

    expect(await screen.findByText('Elisa Nunes')).toBeInTheDocument();
    const toggle = screen.getByRole('switch', { name: /ocultar nomes/i });

    await userEvent.click(toggle);

    expect(screen.getByText('26121194')).toBeInTheDocument();
    expect(screen.getByText('26121192')).toBeInTheDocument();
    expect(screen.queryByText('Elisa Nunes')).not.toBeInTheDocument();
  });

  it('opens modal on student card click and updates list optimistically after saving', async () => {
    vi.mocked(evaluationService.adjustSelfAssessment).mockResolvedValue({
      alunoId: 'student-1',
      notaOriginal: 8.0,
      notaVigente: 7.0,
      ajuste: {
        valorAnterior: 8.0,
        valorNovo: 7.0,
        justificativa: 'Participação ativa e correção de conceitos na mesa.',
        autor: { id: 'prof-1', nome: 'Professor Fernando' },
        ajustadoEm: new Date().toISOString(),
      },
    });

    renderHistoryPage();

    const studentCard = await screen.findByRole('button', {
      name: /ajustar autoavaliação de elisa nunes/i,
    });
    await userEvent.click(studentCard);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Elisa Nunes' })).toBeInTheDocument();

    const gradeInput = screen.getByLabelText('Nova nota');
    const justificationInput = screen.getByLabelText(/justificativa do ajuste/i);
    const saveButton = screen.getByRole('button', { name: 'Salvar ajuste' });

    await userEvent.clear(gradeInput);
    await userEvent.type(gradeInput, '7.0');
    await userEvent.type(justificationInput, 'Participação ativa e correção de conceitos na mesa.');

    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(evaluationService.adjustSelfAssessment).toHaveBeenCalledWith('sess-1', 'student-1', {
      novaNota: 7.0,
      justificativa: 'Participação ativa e correção de conceitos na mesa.',
    });

    expect(screen.getAllByText('Ajustada com justificativa')).toHaveLength(2);
  });
});
