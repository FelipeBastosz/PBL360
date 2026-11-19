import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionService } from '@/services/session.service';
import type { SessionGeneralEvaluation } from '@/types/session';
import { SessionGeneralEvaluationSection } from './SessionGeneralEvaluationSection';

vi.mock('@/services/session.service', () => ({
  sessionService: {
    getGeneralEvaluations: vi.fn(),
  },
}));

const mockEvaluation1: SessionGeneralEvaluation = {
  id: 'eval-1',
  texto: 'Participação ativa de todos os alunos.',
  autor: { id: 'prof-1', nome: 'Prof. Carlos' },
  criadoEm: '2026-04-12T10:00:00Z',
  editadoEm: '2026-04-12T11:00:00Z',
};

const mockEvaluation2: SessionGeneralEvaluation = {
  id: 'eval-2',
  texto: 'Considerações complementares da co-tutoria.',
  autor: { id: 'prof-2', nome: 'Profa. Ana' },
  criadoEm: '2026-04-12T10:30:00Z',
  editadoEm: null,
};

describe('SessionGeneralEvaluationSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unavailable notice when no evaluation is available', async () => {
    vi.mocked(sessionService.getGeneralEvaluations).mockResolvedValueOnce([]);

    render(<SessionGeneralEvaluationSection sessionId="sess-1" />);

    expect(
      await screen.findByText('O feedback geral da sessão ainda não está disponível.'),
    ).toBeInTheDocument();
  });

  it('renders evaluation with author, creation and edition dates, and text', async () => {
    vi.mocked(sessionService.getGeneralEvaluations).mockResolvedValueOnce([mockEvaluation1]);

    render(<SessionGeneralEvaluationSection sessionId="sess-1" />);

    expect(await screen.findByText('Participação ativa de todos os alunos.')).toBeInTheDocument();
    expect(screen.getByText('Prof. Carlos')).toBeInTheDocument();
    expect(screen.getByText(/Criado em 12\/04\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/Editado em 12\/04\/2026/)).toBeInTheDocument();
  });

  it('renders multiple evaluations when registered by co-tutors', async () => {
    vi.mocked(sessionService.getGeneralEvaluations).mockResolvedValueOnce([
      mockEvaluation1,
      mockEvaluation2,
    ]);

    render(<SessionGeneralEvaluationSection sessionId="sess-1" />);

    expect(await screen.findByText('Participação ativa de todos os alunos.')).toBeInTheDocument();
    expect(screen.getByText('Considerações complementares da co-tutoria.')).toBeInTheDocument();
    expect(screen.getByText('Prof. Carlos')).toBeInTheDocument();
    expect(screen.getByText('Profa. Ana')).toBeInTheDocument();
  });

  it('displays error and allows retrying upon failure', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionService.getGeneralEvaluations)
      .mockRejectedValueOnce(new Error('Erro de conexão ao carregar avaliação.'))
      .mockResolvedValueOnce([mockEvaluation1]);

    render(<SessionGeneralEvaluationSection sessionId="sess-1" />);

    expect(await screen.findByText('Erro de conexão ao carregar avaliação.')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: 'Tentar novamente' });
    await user.click(retryBtn);

    expect(await screen.findByText('Participação ativa de todos os alunos.')).toBeInTheDocument();
  });
});
