import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { feedbackService } from '@/services/feedback.service';
import { sessionService } from '@/services/session.service';
import SessionFeedbackPage from './SessionFeedbackPage';

vi.mock('@/services/feedback.service', () => ({
  feedbackService: {
    getMySessionFeedback: vi.fn(),
  },
}));

vi.mock('@/services/session.service', () => ({
  sessionService: {
    getGeneralEvaluations: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'student-1', nome: 'Aluno Teste', tipo: 'ALUNO' },
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/turmas/room-1/problemas/prob-1/sessoes/sess-1/feedback']}>
      <Routes>
        <Route
          path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId/feedback"
          element={<SessionFeedbackPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SessionFeedbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sessionService.getGeneralEvaluations).mockResolvedValue([]);
  });

  it('renders tutor feedback, author, and date without grade block', async () => {
    vi.mocked(feedbackService.getMySessionFeedback).mockResolvedValueOnce({
      id: 'fb-1',
      autor: { id: 'prof-1', nome: 'Prof. Carlos' },
      texto: 'Excelente participação na discussão.',
      criadoEm: '2026-04-12T10:00:00Z',
      editadoEm: null,
      novo: false,
      nota: null,
    });

    renderPage();

    expect(await screen.findByText('Prof. Carlos')).toBeInTheDocument();
    expect(screen.getByText('Excelente participação na discussão.')).toBeInTheDocument();
    expect(screen.queryByTestId('feedback-nota')).not.toBeInTheDocument();
    expect(screen.getByText('Todos os feedbacks do problema')).toBeInTheDocument();
  });

  it('renders "Novo" badge when feedback is new', async () => {
    vi.mocked(feedbackService.getMySessionFeedback).mockResolvedValueOnce({
      id: 'fb-2',
      autor: { id: 'prof-1', nome: 'Prof. Carlos' },
      texto: 'Feedback lido pela primeira vez.',
      criadoEm: '2026-04-12T10:00:00Z',
      editadoEm: null,
      novo: true,
      nota: 8.5,
    });

    renderPage();

    expect(await screen.findByTestId('badge-novo')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-nota')).toHaveTextContent('Nota 8,5');
  });

  it('renders empty state when tutor has not sent feedback yet', async () => {
    vi.mocked(feedbackService.getMySessionFeedback).mockResolvedValueOnce(null);

    renderPage();

    expect(
      await screen.findByText('Seu tutor ainda não enviou feedback para esta sessão'),
    ).toBeInTheDocument();
  });

  it('renders general evaluation unavailable notice when none registered', async () => {
    vi.mocked(feedbackService.getMySessionFeedback).mockResolvedValueOnce(null);
    vi.mocked(sessionService.getGeneralEvaluations).mockResolvedValueOnce([]);

    renderPage();

    expect(
      await screen.findByText('O feedback geral da sessão ainda não está disponível.'),
    ).toBeInTheDocument();
  });

  it('renders general evaluation text, author, and dates alongside individual feedback', async () => {
    vi.mocked(feedbackService.getMySessionFeedback).mockResolvedValueOnce({
      id: 'fb-1',
      autor: { id: 'prof-1', nome: 'Prof. Carlos' },
      texto: 'Individual feedback content.',
      criadoEm: '2026-04-12T10:00:00Z',
      editadoEm: null,
      novo: false,
      nota: 9,
    });
    vi.mocked(sessionService.getGeneralEvaluations).mockResolvedValueOnce([
      {
        id: 'eval-1',
        texto: 'A turma teve um ótimo desempenho coletivo.',
        autor: { id: 'prof-1', nome: 'Prof. Carlos' },
        criadoEm: '2026-04-12T11:00:00Z',
        editadoEm: '2026-04-12T12:00:00Z',
      },
    ]);

    renderPage();

    expect(
      await screen.findByText('A turma teve um ótimo desempenho coletivo.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Individual feedback content.')).toBeInTheDocument();
    expect(screen.getByText(/Criado em 12\/04\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/Editado em 12\/04\/2026/)).toBeInTheDocument();
  });
});
