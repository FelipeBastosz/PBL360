import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluationService } from '@/services/evaluation.service';
import { sessionService } from '@/services/session.service';
import type { PeerEvaluationResponse, SessionPeersResponse } from '@/types/evaluation';
import type { MemberSession } from '@/types/session';
import StudentPeerEvaluationPage from './StudentPeerEvaluationPage';

vi.mock('@/services/evaluation.service');
vi.mock('@/services/session.service');

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'student-self', nome: 'João Aluno', possuiFoto: false, tipo: 'ALUNO' },
  }),
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    notify: mockNotify,
  }),
}));

const mockSession: MemberSession = {
  id: 'sess-1',
  titulo: 'Sessão 2 - Fechamento',
  descricao: null,
  data: '2024-10-08',
  ordem: 2,
  status: 'EM_ANDAMENTO',
  problemaId: 'prob-1',
  salaId: 'room-1',
  problemaTitulo: 'Problema 1',
};

const mockPeersResponse: SessionPeersResponse = {
  liberada: true,
  prazo: '2026-10-20T23:59:00.000Z',
  colegas: [{ alunoId: 'peer-1', nome: 'Ana Souza', iniciais: 'AS', status: 'PENDENTE' }],
};

const mockPeerEvaluation: PeerEvaluationResponse = {
  colegaId: 'peer-1',
  status: 'PENDENTE',
  enviadaEm: null,
  itens: [{ criterioId: 'crit-1', nota: 8 }],
  criterios: [{ id: 'crit-1', nome: 'Segmento', peso: 3.0, ordem: 1 }],
};

describe('StudentPeerEvaluationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sessionService.getForMember).mockResolvedValue(mockSession);
    vi.mocked(evaluationService.listSessionPeers).mockResolvedValue(mockPeersResponse);
    vi.mocked(evaluationService.getPeerEvaluation).mockResolvedValue(mockPeerEvaluation);
    vi.mocked(evaluationService.getMyEvaluationsSummary).mockResolvedValue({
      autoavaliacao: { liberada: true, prazo: null, status: 'PENDENTE' },
      pares: { liberada: true, prazo: null, avaliados: 0, total: 1 },
      feedback: { disponivel: false, novo: false },
    });
  });

  const renderComponent = () => {
    render(
      <MemoryRouter initialEntries={['/sessoes/sess-1/avaliar-colegas']}>
        <Routes>
          <Route
            path="/sessoes/:sessionId/avaliar-colegas"
            element={<StudentPeerEvaluationPage />}
          />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('renders session title, peer evaluation cards, and deadline from backend', async () => {
    renderComponent();

    expect(screen.getByText('Avaliação dos Colegas')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Sessão 2 - Fechamento')).toBeInTheDocument();
      expect(screen.getByText(/Prazo: Até 20 de out\./i)).toBeInTheDocument();
      expect(screen.getByText('Ana Souza')).toBeInTheDocument();
      const segmentoGroup = screen.getByRole('group', { name: 'Segmento' });
      expect(within(segmentoGroup).getByText('8')).toBeInTheDocument();
    });
  });

  it('auto-saves peer draft with debounce (enviar: false) when score changes', async () => {
    vi.mocked(evaluationService.savePeerEvaluation).mockResolvedValue({
      ...mockPeerEvaluation,
      status: 'RASCUNHO',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    });

    const segmentoGroup = screen.getByRole('group', { name: 'Segmento' });
    const plusButton = within(segmentoGroup).getByRole('button', { name: '+' });
    await userEvent.click(plusButton);

    expect(within(segmentoGroup).getByText('9')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(evaluationService.savePeerEvaluation).toHaveBeenCalledWith('sess-1', 'peer-1', {
          itens: [{ criterioId: 'crit-1', nota: 9 }],
          enviar: false,
        });
      },
      { timeout: 1500 },
    );
  });

  it('opens confirmation modal and submits peer evaluations only after confirmation', async () => {
    vi.mocked(evaluationService.savePeerEvaluation).mockResolvedValue({
      ...mockPeerEvaluation,
      status: 'ENVIADA',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    });

    const sendButton = screen.getByRole('button', { name: 'Enviar avaliação' });
    await userEvent.click(sendButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirmar envio da avaliação?')).toBeInTheDocument();
    expect(
      screen.getByText('Após o envio definitivo, não será possível alterar as notas.'),
    ).toBeInTheDocument();

    // Not yet called with enviar: true
    expect(evaluationService.savePeerEvaluation).not.toHaveBeenCalledWith('sess-1', 'peer-1', {
      itens: expect.any(Array),
      enviar: true,
    });

    const confirmButton = screen.getByRole('button', { name: 'Confirmar Envio' });
    await userEvent.click(confirmButton);

    expect(evaluationService.savePeerEvaluation).toHaveBeenCalledWith('sess-1', 'peer-1', {
      itens: [{ criterioId: 'crit-1', nota: 8 }],
      enviar: true,
    });
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'success',
      message: 'Avaliações de colegas enviadas com sucesso!',
    });
  });

  it('renders friendly empty state when student did not participate', async () => {
    vi.mocked(evaluationService.listSessionPeers).mockResolvedValue({
      ...mockPeersResponse,
      participou: false,
      colegas: [],
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
