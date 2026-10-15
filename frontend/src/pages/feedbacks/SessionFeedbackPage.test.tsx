import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { feedbackService } from '@/services/feedback.service';
import SessionFeedbackPage from './SessionFeedbackPage';

vi.mock('@/services/feedback.service', () => ({
  feedbackService: {
    getMySessionFeedback: vi.fn(),
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
  });

  it('renders tutor feedback, author, and date without grade block', async () => {
    vi.mocked(feedbackService.getMySessionFeedback).mockResolvedValueOnce({
      id: 'fb-1',
      autor: { id: 'prof-1', nome: 'Prof. Carlos' },
      texto: 'Excelente participação na discussão.',
      criadoEm: '2026-04-12T10:00:00Z',
      editadoEm: null,
      novo: false,
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
    });

    renderPage();

    expect(await screen.findByTestId('badge-novo')).toBeInTheDocument();
  });

  it('renders empty state when tutor has not sent feedback yet', async () => {
    vi.mocked(feedbackService.getMySessionFeedback).mockResolvedValueOnce(null);

    renderPage();

    expect(
      await screen.findByText('Seu tutor ainda não enviou feedback para esta sessão'),
    ).toBeInTheDocument();
  });
});
