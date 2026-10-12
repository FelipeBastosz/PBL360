import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluationService } from '@/services/evaluation.service';
import { observationService } from '@/services/observation.service';
import type { TutorEvaluationData } from '@/types/evaluation';
import { StudentEvaluationPage } from './StudentEvaluationPage';

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Silva', tipo: 'PROFESSOR' } }),
}));

vi.mock('@/services/evaluation.service');
vi.mock('@/services/observation.service');

const mockEvalData: TutorEvaluationData = {
  status: 'PENDENTE',
  enviadaEm: null,
  notaSessao: null,
  criterios: [
    { id: 'c1', nome: 'Seguimento', peso: 3.0, ordem: 1 },
    { id: 'c2', nome: 'Participação', peso: 3.5, ordem: 2 },
  ],
  itens: [
    { criterioId: 'c1', nota: 8 },
    { criterioId: 'c2', nota: 6 },
  ],
};

const mockTags = [
  { id: 't1', nome: 'Celular fora de contexto' },
  { id: 't2', nome: 'Atraso' },
];

describe('StudentEvaluationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(evaluationService.getEvaluation).mockResolvedValue(mockEvalData);
    vi.mocked(evaluationService.getFeedback).mockResolvedValue(null);
    vi.mocked(observationService.listTags).mockResolvedValue(mockTags);
    vi.mocked(observationService.listStudentObservations).mockResolvedValue({
      observacoes: [
        {
          id: 'obs-1',
          marcacoes: [{ id: 't1', nome: 'Celular fora de contexto' }],
          texto: null,
          criadaEm: '',
        },
      ],
      contagem: { t1: 1 },
    });
  });

  function renderPage(sessionId = 's1', studentId = 'st1') {
    return render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: `/sessoes/${sessionId}/avaliacao/${studentId}`,
            state: { studentName: 'Ana Souza' },
          },
        ]}
      >
        <Routes>
          <Route
            path="/sessoes/:sessionId/avaliacao/:studentId"
            element={<StudentEvaluationPage />}
          />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders student criteria, weights, and calculates final session grade', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Notas do aluno: Ana Souza' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Nota final da sessão')).toBeInTheDocument();
    expect(screen.getByText('6.9')).toBeInTheDocument();
  });

  it('saves empty feedback when cleared by user', async () => {
    vi.mocked(evaluationService.saveEvaluation).mockResolvedValue(mockEvalData);
    vi.mocked(evaluationService.saveFeedback).mockResolvedValue({
      id: 'fb1',
      texto: '',
      criadoEm: '',
    });

    renderPage();

    await screen.findByRole('heading', { name: 'Notas do aluno: Ana Souza' });
    const feedbackInput = screen.getByPlaceholderText(
      'Escreva aqui um feedback para o(a) aluno(a)...',
    );
    await userEvent.clear(feedbackInput);

    await userEvent.click(screen.getByRole('button', { name: 'Enviar avaliação e feedback' }));

    await waitFor(() => {
      expect(evaluationService.saveFeedback).toHaveBeenCalledWith('s1', 'st1', '');
    });
  });

  it('disables draft button and displays notice when status is ENVIADA', async () => {
    vi.mocked(evaluationService.getEvaluation).mockResolvedValue({
      ...mockEvalData,
      status: 'ENVIADA',
    });

    renderPage();

    await screen.findByRole('heading', { name: 'Notas do aluno: Ana Souza' });
    const draftBtn = screen.getByRole('button', { name: 'Salvar rascunho' });
    expect(draftBtn).toBeDisabled();
    expect(
      screen.getByText('Esta avaliação já foi enviada. Não é permitido salvá-la como rascunho.'),
    ).toBeInTheDocument();
  });

  it('preserves draft in session storage when navigating to tags even if evaluation is ENVIADA', async () => {
    vi.mocked(evaluationService.getEvaluation).mockResolvedValue({
      ...mockEvalData,
      status: 'ENVIADA',
    });

    renderPage();

    await screen.findByRole('heading', { name: 'Notas do aluno: Ana Souza' });
    await userEvent.click(screen.getByRole('button', { name: 'Ver outras marcações' }));

    const saved = JSON.parse(sessionStorage.getItem('eval_draft_s1_st1') || '{}');
    expect(saved.scores).toEqual({ c1: 8, c2: 6 });
    expect(evaluationService.saveEvaluation).not.toHaveBeenCalled();
  });
});
