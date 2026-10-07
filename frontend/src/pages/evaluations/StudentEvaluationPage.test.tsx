import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluationService } from '@/services/evaluation.service';
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

describe('StudentEvaluationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(evaluationService.getEvaluation).mockResolvedValue(mockEvalData);
    vi.mocked(evaluationService.getFeedback).mockResolvedValue(null);
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

  it('renders student criteria with scores and weight indicators', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Notas do aluno: Ana Souza' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Seguimento')).toBeInTheDocument();
    expect(screen.getByText('Peso 3,0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('8')).toBeInTheDocument();
  });

  it('allows clicking on the score to type decimal values directly', async () => {
    renderPage();

    await screen.findByRole('heading', { name: 'Notas do aluno: Ana Souza' });
    const scoreInput = screen.getByLabelText('Nota de Seguimento');
    await userEvent.clear(scoreInput);
    await userEvent.type(scoreInput, '8.5');

    expect(screen.getByDisplayValue('8.5')).toBeInTheDocument();
  });

  it('increments and decrements criteria scores within 0 and 10 bounds', async () => {
    renderPage();

    await screen.findByRole('heading', { name: 'Notas do aluno: Ana Souza' });
    const plusBtn = screen.getByRole('button', { name: 'Aumentar nota de Seguimento' });
    await userEvent.click(plusBtn);

    expect(screen.getByDisplayValue('9')).toBeInTheDocument();
  });

  it('renders quick observation tags and complementary text field', async () => {
    renderPage();

    expect(await screen.findByText('Observações rápidas')).toBeInTheDocument();
    expect(screen.getByText('Celular fora de contexto')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Observação complementar (texto livre)'),
    ).toBeInTheDocument();
  });

  it('renders feedback textarea and submits evaluation', async () => {
    vi.mocked(evaluationService.saveEvaluation).mockResolvedValue(mockEvalData);
    vi.mocked(evaluationService.saveFeedback).mockResolvedValue({
      id: 'fb1',
      texto: 'Muito bom',
      criadoEm: '',
    });

    renderPage();

    await screen.findByRole('heading', { name: 'Notas do aluno: Ana Souza' });
    const feedbackInput = screen.getByPlaceholderText(
      'Escreva aqui um feedback para o(a) aluno(a)...',
    );
    await userEvent.type(feedbackInput, 'Muito bom');

    await userEvent.click(screen.getByRole('button', { name: 'Enviar avaliação e feedback' }));

    await waitFor(() => {
      expect(evaluationService.saveEvaluation).toHaveBeenCalledWith(
        's1',
        'st1',
        expect.objectContaining({ enviar: true }),
      );
    });
  });

  it('requests justification when updating an already submitted evaluation', async () => {
    vi.mocked(evaluationService.getEvaluation).mockResolvedValue({
      ...mockEvalData,
      status: 'ENVIADA',
    });

    renderPage();

    await screen.findByRole('heading', { name: 'Notas do aluno: Ana Souza' });
    await userEvent.click(screen.getByRole('button', { name: 'Enviar avaliação e feedback' }));

    expect(await screen.findByText('Justificativa da alteração')).toBeInTheDocument();
  });
});
