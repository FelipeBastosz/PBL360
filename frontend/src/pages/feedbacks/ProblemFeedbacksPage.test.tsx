import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { feedbackService } from '@/services/feedback.service';
import ProblemFeedbacksPage from './ProblemFeedbacksPage';

vi.mock('@/services/feedback.service', () => ({
  feedbackService: {
    getMyProblemFeedbacks: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'student-1', nome: 'Aluno Teste', tipo: 'ALUNO' },
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/turmas/room-1/problemas/prob-1/feedbacks']}>
      <Routes>
        <Route
          path="/turmas/:roomId/problemas/:problemId/feedbacks"
          element={<ProblemFeedbacksPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProblemFeedbacksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders individual feedback at the top with score, general feedback, and sessions in order', async () => {
    vi.mocked(feedbackService.getMyProblemFeedbacks).mockResolvedValueOnce({
      individual: {
        id: 'fb-ind',
        autor: { id: 'prof-1', nome: 'Prof. Silva' },
        texto: 'Desempenho individual excelente.',
        criadoEm: '2026-04-10T10:00:00Z',
        editadoEm: null,
        novo: true,
        nota: 9.0,
      },
      geral: {
        id: 'fb-geral',
        autor: { id: 'prof-1', nome: 'Prof. Silva' },
        texto: 'A turma desenvolveu ótimas hipóteses.',
        criadoEm: '2026-04-09T10:00:00Z',
        editadoEm: null,
        novo: false,
      },
      sessoes: [
        {
          sessaoId: 'sess-1',
          rotulo: 'Sessão 1',
          data: '01-04-2026',
          feedback: {
            id: 'fb-s1',
            autor: { id: 'prof-1', nome: 'Prof. Silva' },
            texto: 'Bom início de abertura.',
            criadoEm: '2026-04-02T10:00:00Z',
            editadoEm: null,
            novo: false,
          },
        },
        {
          sessaoId: 'sess-2',
          rotulo: 'Sessão 2',
          data: '08-04-2026',
          feedback: null,
        },
      ],
    });

    renderPage();

    // Verify sections and ordering
    expect(await screen.findByRole('heading', { name: 'Feedback Individual' })).toBeInTheDocument();
    expect(screen.getByText('Desempenho individual excelente.')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-nota')).toHaveTextContent('Nota 9.0');
    expect(screen.getByTestId('badge-novo')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Geral da Turma' })).toBeInTheDocument();
    expect(screen.getByText('A turma desenvolveu ótimas hipóteses.')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Por Sessão' })).toBeInTheDocument();
    expect(screen.getByText('Bom início de abertura.')).toBeInTheDocument();
    expect(screen.getByText('Feedback ainda não disponível para esta sessão.')).toBeInTheDocument();
  });

  it('renders empty state when there are no feedbacks', async () => {
    vi.mocked(feedbackService.getMyProblemFeedbacks).mockResolvedValueOnce({
      individual: null,
      geral: null,
      sessoes: [],
    });

    renderPage();

    expect(
      await screen.findByText('Nenhum feedback disponível para este problema ainda.'),
    ).toBeInTheDocument();
  });
});
