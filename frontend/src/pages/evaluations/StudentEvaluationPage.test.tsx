import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluationService } from '@/services/evaluation.service';
import { observationService } from '@/services/observation.service';
import { planningPokerService } from '@/services/planningPoker.service';
import type { TutorEvaluationData } from '@/types/evaluation';
import { StudentEvaluationPage } from './StudentEvaluationPage';

vi.mock('@/services/evaluation.service');
vi.mock('@/services/observation.service');
vi.mock('@/services/planningPoker.service', () => ({
  planningPokerService: {
    getAvailability: vi.fn().mockResolvedValue({
      disponivel: true,
      motivo: null,
      presentes: 2,
      pokerAbertoId: null,
    }),
  },
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Silva', tipo: 'PROFESSOR' } }),
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

const mockEvalData: TutorEvaluationData = {
  status: 'PENDENTE',
  enviadaEm: null,
  notaSessao: null,
  criterios: [
    { id: 'crit-1', nome: 'Seguimento', peso: 3.0, ordem: 1 },
    { id: 'crit-2', nome: 'Participação', peso: 3.5, ordem: 2 },
  ],
  itens: [
    { criterioId: 'crit-1', nota: 8 },
    { criterioId: 'crit-2', nota: 6 },
  ],
};

describe('StudentEvaluationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(planningPokerService.getAvailability).mockResolvedValue({
      disponivel: true,
      motivo: null,
      presentes: 2,
      pokerAbertoId: null,
    });
    vi.mocked(evaluationService.getEvaluation).mockResolvedValue(mockEvalData);
    vi.mocked(evaluationService.getFeedback).mockResolvedValue(null);
    vi.mocked(observationService.listTags).mockResolvedValue([]);
    vi.mocked(observationService.listStudentObservations).mockResolvedValue({
      observacoes: [],
      contagem: {},
    });
  });

  function renderPage() {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/sessoes/sess-1/avaliacao/st-1', state: { studentName: 'Ana Souza' } },
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

    expect(await screen.findByText('Notas do aluno: Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Seguimento')).toBeInTheDocument();
    expect(screen.getByText('Peso 3,0')).toBeInTheDocument();

    const segInput = screen.getByLabelText('Nota de Seguimento');
    expect(segInput).toHaveValue('8,0');

    const partInput = screen.getByLabelText('Nota de Participação');
    expect(partInput).toHaveValue('6,0');

    expect(screen.getByText('Nota final da sessão')).toBeInTheDocument();
    expect(screen.getByText('6,9')).toBeInTheDocument();
  });

  it('shows the grade typed by the tutor with a comma', async () => {
    renderPage();

    const input = await screen.findByRole('textbox', { name: 'Nota de Seguimento' });
    expect(input).toHaveValue('8,0');

    await userEvent.clear(input);
    await userEvent.type(input, '7,5');
    await userEvent.tab();
    expect(input).toHaveValue('7,5');

    await userEvent.clear(input);
    await userEvent.type(input, '6.25');
    await userEvent.tab();
    expect(input).toHaveValue('6,3');
  });

  it('increments score, saves draft, and respects boundaries', async () => {
    vi.mocked(evaluationService.saveEvaluation).mockResolvedValue(mockEvalData);
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText('Nota de Seguimento')).toBeInTheDocument();
    });

    const incBtn = screen.getByRole('button', { name: 'Aumentar nota de Seguimento' });
    await userEvent.click(incBtn);

    expect(screen.getByLabelText('Nota de Seguimento')).toHaveValue('9,0');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));

    expect(evaluationService.saveEvaluation).toHaveBeenCalledWith('sess-1', 'st-1', {
      itens: [
        { criterioId: 'crit-1', nota: 9 },
        { criterioId: 'crit-2', nota: 6 },
      ],
      enviar: false,
      justificativa: undefined,
      notaCargo: null,
    });
  });

  it('requires justification to submit changes for already submitted evaluation', async () => {
    vi.mocked(evaluationService.getEvaluation).mockResolvedValue({
      ...mockEvalData,
      status: 'ENVIADA',
    });
    vi.mocked(evaluationService.saveEvaluation).mockResolvedValue(mockEvalData);
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText('Esta avaliação já foi enviada. Não é permitido salvá-la como rascunho.'),
      ).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Enviar avaliação e feedback' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }));
    expect(screen.getByText('Mínimo de 10 caracteres.')).toBeInTheDocument();

    await userEvent.type(
      screen.getByPlaceholderText(/alteração/i),
      'Justificativa de teste válida',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }));

    expect(evaluationService.saveEvaluation).toHaveBeenCalledWith('sess-1', 'st-1', {
      itens: [
        { criterioId: 'crit-1', nota: 8 },
        { criterioId: 'crit-2', nota: 6 },
      ],
      enviar: true,
      justificativa: 'Justificativa de teste válida',
      notaCargo: null,
    });
  });

  it('blocks actions and shows alert when planning poker is active', async () => {
    vi.mocked(planningPokerService.getAvailability).mockResolvedValue({
      disponivel: true,
      motivo: null,
      presentes: 2,
      pokerAbertoId: 'poker-1',
    });

    renderPage();

    expect(
      await screen.findByText(
        /a avaliação direta do tutor está bloqueada enquanto o planning poker estiver ativo/i,
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Enviar avaliação e feedback' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Salvar rascunho' })).toBeDisabled();
  });
});
