import { render, screen } from '@testing-library/react';
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

  it('renders quick observation tag and decrements count when clicking minus button', async () => {
    vi.mocked(observationService.undoObservation).mockResolvedValue(undefined);
    renderPage();

    expect(await screen.findByText('Celular fora de contexto')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    const minusBtn = screen.getByRole('button', {
      name: 'Diminuir marcação Celular fora de contexto',
    });
    await userEvent.click(minusBtn);

    expect(observationService.undoObservation).toHaveBeenCalledWith('obs-1');
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });
});
