import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionService } from '@/services/session.service';
import { evaluationService } from '@/services/evaluation.service';
import type { MemberSession } from '@/types/session';
import type { PeerEvaluationResponse, SessionPeersResponse } from '@/types/evaluation';
import StudentPeerEvaluationPage from './StudentPeerEvaluationPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('@/services/session.service');
vi.mock('@/services/evaluation.service');

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

const mockSessionData: MemberSession = {
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
  prazo: null,
  colegas: [{ alunoId: 'peer-1', nome: 'Ana Souza', iniciais: 'AS', status: 'PENDENTE' }],
};

const mockPeerEvaluation: PeerEvaluationResponse = {
  colega: { alunoId: 'peer-1', nome: 'Ana Souza' },
  status: 'PENDENTE',
  enviadaEm: null,
  itens: [{ criterioId: 'crit-1', nota: 8 }],
  criterios: [{ id: 'crit-1', nome: 'Segmento', peso: 3.0, ordem: 1 }],
};

describe('StudentPeerEvaluationPage', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(sessionService.getForMember).mockResolvedValue(mockSessionData);
    vi.mocked(evaluationService.listSessionPeers).mockResolvedValue(mockPeersResponse);
    vi.mocked(evaluationService.getPeerEvaluation).mockResolvedValue(mockPeerEvaluation);
    vi.mocked(evaluationService.getMyEvaluationsSummary).mockResolvedValue({
      autoavaliacao: { liberada: true, prazo: null, status: 'PENDENTE' },
      pares: { liberada: true, prazo: null, avaliados: 0, total: 1 },
      feedback: { disponivel: false, novo: false },
    });
  });

  const renderPage = () => {
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

  it('renders the header with session title and peer evaluation cards', async () => {
    renderPage();
    expect(screen.getByText('Avaliação dos Colegas')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Sessão 2 - Fechamento')).toBeInTheDocument();
      expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    });
  });

  it('increments score for a specific peer', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    });

    const anaSection = screen.getByRole('region', { name: 'Avaliação de Ana Souza' });
    const segmentoGroup = within(anaSection).getByRole('group', { name: 'Segmento' });
    const plusButton = within(segmentoGroup).getByRole('button', { name: '+' });

    await userEvent.click(plusButton);

    expect(within(segmentoGroup).getByText('9')).toBeInTheDocument();
  });

  it('navigates back when clicking the back button', async () => {
    renderPage();
    const backButton = screen.getByRole('button', { name: 'Voltar' });

    await userEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('opens confirmation modal and submits peer evaluations only after confirmation', async () => {
    vi.mocked(evaluationService.savePeerEvaluation).mockResolvedValue({
      ...mockPeerEvaluation,
      status: 'ENVIADA',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'Enviar avaliação' });
    await userEvent.click(saveButton);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const confirmButton = within(dialog).getByRole('button', { name: 'Confirmar Envio' });
    await userEvent.click(confirmButton);

    expect(evaluationService.savePeerEvaluation).toHaveBeenCalledWith('sess-1', 'peer-1', {
      itens: [{ criterioId: 'crit-1', nota: 8 }],
      notaCargo: null,
      enviar: true,
    });
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
