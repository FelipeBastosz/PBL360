import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluationService } from '@/services/evaluation.service';
import type { StudentEvaluationSummaryResponse } from '@/types/evaluation';
import { StudentEvaluationCenter } from './StudentEvaluationCenter';

vi.mock('@/services/evaluation.service');

const mockReleasedSummary: StudentEvaluationSummaryResponse = {
  autoavaliacao: {
    liberada: true,
    prazo: null,
    status: 'PENDENTE',
  },
  pares: {
    liberada: true,
    prazo: null,
    avaliados: 1,
    total: 3,
  },
  feedback: {
    disponivel: true,
    novo: false,
    avaliacaoTutorEnviada: true,
  },
};

const mockLockedSummary: StudentEvaluationSummaryResponse = {
  autoavaliacao: {
    liberada: false,
    prazo: null,
    status: 'INDISPONIVEL',
  },
  pares: {
    liberada: false,
    prazo: null,
    avaliados: 0,
    total: 3,
  },
  feedback: {
    disponivel: false,
    novo: false,
    avaliacaoTutorEnviada: false,
  },
};

describe('StudentEvaluationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (feedbackHref = '/turmas/r1/problemas/p1/sessoes/sess-1/feedback') => {
    render(
      <MemoryRouter initialEntries={['/turmas/r1/problemas/p1/sessoes/sess-1']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId"
            element={
              <StudentEvaluationCenter feedbackHref={feedbackHref}>
                <div data-testid="poker-notice">Aviso Poker</div>
              </StudentEvaluationCenter>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('renders released evaluations with links and badges', async () => {
    vi.mocked(evaluationService.getMyEvaluationsSummary).mockResolvedValue(mockReleasedSummary);
    renderComponent();

    expect(screen.getByTestId('poker-notice')).toBeInTheDocument();

    await waitFor(() => {
      const selfLink = screen.getByRole('link', { name: /autoavaliação/i });
      expect(selfLink).toHaveAttribute('href', '/sessoes/sess-1/autoavaliacao');
      expect(screen.getByText('Pendente')).toBeInTheDocument();

      const peerLink = screen.getByRole('link', { name: /avaliar colegas/i });
      expect(peerLink).toHaveAttribute('href', '/sessoes/sess-1/avaliar-colegas');
      expect(screen.getByText('1/3 avaliados')).toBeInTheDocument();

      const feedbackLink = screen.getByRole('link', { name: /notas e feedbacks/i });
      expect(feedbackLink).toHaveAttribute(
        'href',
        '/turmas/r1/problemas/p1/sessoes/sess-1/feedback',
      );
      expect(screen.getByText('Disponível')).toBeInTheDocument();
    });
  });

  it('renders locked status and disables links when evaluations are not released', async () => {
    vi.mocked(evaluationService.getMyEvaluationsSummary).mockResolvedValue(mockLockedSummary);
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getAllByText('Bloqueada')).toHaveLength(2);
      expect(screen.getByText('Indisponível')).toBeInTheDocument();
      expect(
        screen.getByText('Você ainda não foi avaliado pelo tutor nesta sessão.'),
      ).toBeInTheDocument();
    });
  });

  it('does not show the unevaluated reason after the tutor has submitted an evaluation', async () => {
    vi.mocked(evaluationService.getMyEvaluationsSummary).mockResolvedValue({
      ...mockLockedSummary,
      feedback: {
        ...mockLockedSummary.feedback,
        avaliacaoTutorEnviada: true,
      },
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Indisponível')).toBeInTheDocument();
      expect(
        screen.queryByText('Você ainda não foi avaliado pelo tutor nesta sessão.'),
      ).not.toBeInTheDocument();
    });
  });

  it('renders deadline when provided in summary', async () => {
    vi.mocked(evaluationService.getMyEvaluationsSummary).mockResolvedValue({
      ...mockReleasedSummary,
      autoavaliacao: {
        ...mockReleasedSummary.autoavaliacao,
        prazo: '2026-10-15T17:00:00.000Z',
      },
      pares: {
        ...mockReleasedSummary.pares,
        prazo: '2026-10-20T23:59:00.000Z',
      },
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Prazo: Até 15 de out\./i)).toBeInTheDocument();
      expect(screen.getByText(/Prazo: Até 20 de out\./i)).toBeInTheDocument();
    });
  });

  it('renders friendly empty state when student did not participate in the session', async () => {
    vi.mocked(evaluationService.getMyEvaluationsSummary).mockResolvedValue({
      ...mockLockedSummary,
      autoavaliacao: {
        liberada: false,
        prazo: null,
        status: 'NAO_PARTICIPOU',
      },
    });
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(
          'Você não participou desta sessão, portanto não possui avaliações disponíveis.',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /autoavaliação/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /avaliar colegas/i })).not.toBeInTheDocument();
    });
  });
});
