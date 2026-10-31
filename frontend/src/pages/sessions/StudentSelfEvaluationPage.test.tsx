import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluationService } from '@/services/evaluation.service';
import { sessionService } from '@/services/session.service';
import type { SelfAssessmentResponse } from '@/types/evaluation';
import type { MemberSession } from '@/types/session';
import StudentSelfEvaluationPage from './StudentSelfEvaluationPage';

vi.mock('@/services/evaluation.service');
vi.mock('@/services/session.service');

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', nome: 'João Silva', possuiFoto: false, tipo: 'ALUNO' },
  }),
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    notify: mockNotify,
  }),
}));

const mockAssessmentData: SelfAssessmentResponse = {
  status: 'PENDENTE',
  prazo: '2026-10-15T17:00:00.000Z',
  enviadaEm: null,
  notaSessao: null,
  criterios: [
    { id: 'crit-1', nome: 'Segmento', peso: 3.0, ordem: 1 },
    { id: 'crit-2', nome: 'Participação', peso: 3.5, ordem: 2 },
  ],
  itens: [
    { criterioId: 'crit-1', nota: 8 },
    { criterioId: 'crit-2', nota: 6 },
  ],
};

const mockSessionData: MemberSession = {
  id: 'sess-123',
  titulo: 'Sessão 2 - Fechamento',
  descricao: null,
  data: '2024-10-08',
  ordem: 2,
  status: 'EM_ANDAMENTO',
  problemaId: 'prob-1',
  salaId: 'room-1',
  problemaTitulo: 'Problema 1',
};

describe('StudentSelfEvaluationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sessionService.getForMember).mockResolvedValue(mockSessionData);
  });

  const renderComponent = () => {
    render(
      <MemoryRouter initialEntries={['/sessoes/sess-123/autoavaliacao']}>
        <Routes>
          <Route path="/sessoes/:sessionId/autoavaliacao" element={<StudentSelfEvaluationPage />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('loads and displays criteria, student data, session title, and deadline from backend', async () => {
    vi.mocked(evaluationService.getSelfAssessment).mockResolvedValue(mockAssessmentData);
    renderComponent();

    expect(screen.getByText('Autoavaliação')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Sessão 2 - Fechamento')).toBeInTheDocument();
      expect(screen.getByText(/Prazo: Até 15 de out\./i)).toBeInTheDocument();
      const segmentoGroup = screen.getByRole('group', { name: 'Segmento' });
      expect(within(segmentoGroup).getByText('8')).toBeInTheDocument();
    });
  });

  it('auto-saves draft with debounce (enviar: false) when score changes', async () => {
    vi.mocked(evaluationService.getSelfAssessment).mockResolvedValue(mockAssessmentData);
    vi.mocked(evaluationService.saveSelfAssessment).mockResolvedValue({
      ...mockAssessmentData,
      status: 'RASCUNHO',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('group', { name: 'Segmento' })).toBeInTheDocument();
    });

    const segmentoGroup = screen.getByRole('group', { name: 'Segmento' });
    const plusButton = within(segmentoGroup).getByRole('button', { name: '+' });
    await userEvent.click(plusButton);

    expect(within(segmentoGroup).getByText('9')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(evaluationService.saveSelfAssessment).toHaveBeenCalledWith('sess-123', {
          itens: [
            { criterioId: 'crit-1', nota: 9 },
            { criterioId: 'crit-2', nota: 6 },
          ],
          enviar: false,
        });
      },
      { timeout: 1500 },
    );
  });

  it('opens confirmation modal and submits final assessment only after confirmation', async () => {
    vi.mocked(evaluationService.getSelfAssessment).mockResolvedValue(mockAssessmentData);
    vi.mocked(evaluationService.saveSelfAssessment).mockResolvedValue({
      ...mockAssessmentData,
      status: 'ENVIADA',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('group', { name: 'Segmento' })).toBeInTheDocument();
    });

    const sendButton = screen.getByRole('button', { name: 'Enviar avaliação' });
    await userEvent.click(sendButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirmar envio da avaliação?')).toBeInTheDocument();
    expect(
      screen.getByText('Após o envio definitivo, não será possível alterar as notas.'),
    ).toBeInTheDocument();

    // Not yet called with enviar: true
    expect(evaluationService.saveSelfAssessment).not.toHaveBeenCalledWith('sess-123', {
      itens: expect.any(Array),
      enviar: true,
    });

    const confirmButton = screen.getByRole('button', { name: 'Confirmar Envio' });
    await userEvent.click(confirmButton);

    expect(evaluationService.saveSelfAssessment).toHaveBeenCalledWith('sess-123', {
      itens: [
        { criterioId: 'crit-1', nota: 8 },
        { criterioId: 'crit-2', nota: 6 },
      ],
      enviar: true,
    });
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'success',
      message: 'Autoavaliação enviada com sucesso!',
    });
  });

  it('renders friendly empty state when student did not participate', async () => {
    vi.mocked(evaluationService.getSelfAssessment).mockResolvedValue({
      ...mockAssessmentData,
      status: 'NAO_PARTICIPOU',
    });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(
          'Você não participou desta sessão, portanto não possui avaliações disponíveis.',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Enviar avaliação' })).not.toBeInTheDocument();
    });
  });
});
