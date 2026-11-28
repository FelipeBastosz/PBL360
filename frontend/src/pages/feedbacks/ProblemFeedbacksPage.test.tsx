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
      notaFinal: 8.7,
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
        nota: null,
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
            nota: 8.5,
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
    expect(screen.getByText('Nota 9,0')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-nota-final')).toHaveTextContent('Nota final 8,7');
    expect(screen.getByTestId('badge-novo')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Geral da Turma' })).toBeInTheDocument();
    expect(screen.getByText('A turma desenvolveu ótimas hipóteses.')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Por Sessão' })).toBeInTheDocument();
    expect(screen.getByText('Bom início de abertura.')).toBeInTheDocument();
    expect(screen.getByText('Nota 8,5')).toBeInTheDocument();
    expect(screen.getByText('Feedback ainda não disponível para esta sessão.')).toBeInTheDocument();
  });

  it('renders empty state when there are no feedbacks', async () => {
    vi.mocked(feedbackService.getMyProblemFeedbacks).mockResolvedValueOnce({
      notaFinal: null,
      individual: null,
      geral: null,
      sessoes: [],
    });

    renderPage();

    expect(
      await screen.findByText('Nenhum feedback disponível para este problema ainda.'),
    ).toBeInTheDocument();
  });

  it('renders the final score even when no feedbacks are available', async () => {
    vi.mocked(feedbackService.getMyProblemFeedbacks).mockResolvedValueOnce({
      notaFinal: 8.75,
      individual: null,
      geral: null,
      sessoes: [],
    });

    renderPage();

    expect(await screen.findByTestId('feedback-nota-final')).toHaveTextContent('Nota final 8,8');
    expect(
      screen.queryByText('Nenhum feedback disponível para este problema ainda.'),
    ).not.toBeInTheDocument();
  });

  it('hides general feedback section when unreleased and never exposes edit controls to students', async () => {
    vi.mocked(feedbackService.getMyProblemFeedbacks).mockResolvedValueOnce({
      notaFinal: null,
      individual: {
        id: 'fb-ind-only',
        autor: { id: 'prof-1', nome: 'Prof. Silva' },
        texto: 'Bom desempenho individual.',
        criadoEm: '2026-04-10T10:00:00Z',
        editadoEm: null,
        novo: false,
        nota: null,
      },
      geral: null,
      sessoes: [],
    });

    renderPage();

    expect(await screen.findByText('Bom desempenho individual.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Geral da Turma' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /salvar|editar/i })).not.toBeInTheDocument();
  });

  it('displays general feedback strictly in read-only mode when released to the student', async () => {
    vi.mocked(feedbackService.getMyProblemFeedbacks).mockResolvedValueOnce({
      notaFinal: null,
      individual: null,
      geral: {
        id: 'fb-geral-released',
        autor: { id: 'prof-1', nome: 'Prof. Silva' },
        texto: 'A turma demonstrou excelente organização.',
        criadoEm: '2026-04-11T10:00:00Z',
        editadoEm: null,
        novo: true,
        nota: null,
      },
      sessoes: [],
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Geral da Turma' })).toBeInTheDocument();
    expect(screen.getByText('A turma demonstrou excelente organização.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /salvar|editar/i })).not.toBeInTheDocument();
  });

  it('displays session score and discreet notice when session has grade without textual feedback', async () => {
    vi.mocked(feedbackService.getMyProblemFeedbacks).mockResolvedValueOnce({
      notaFinal: 8.5,
      individual: null,
      geral: null,
      sessoes: [
        {
          sessaoId: 'sess-1',
          rotulo: 'Sessão 1',
          data: '01-04-2026',
          feedback: {
            id: null,
            autor: { id: 'prof-1', nome: 'Prof. Silva' },
            texto: null,
            criadoEm: '2026-04-02T10:00:00Z',
            editadoEm: null,
            novo: false,
            nota: 8.5,
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

    expect(await screen.findByTestId('feedback-nota-final')).toHaveTextContent('Nota final 8,5');
    expect(screen.getByTestId('feedback-nota')).toHaveTextContent('Nota 8,5');
    expect(screen.getByText('Sessão 1')).toBeInTheDocument();
    expect(
      screen.getByText('Nenhum feedback textual registrado para esta sessão.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Sessão 2')).toBeInTheDocument();
    expect(screen.getByText('Feedback ainda não disponível para esta sessão.')).toBeInTheDocument();
  });
});
