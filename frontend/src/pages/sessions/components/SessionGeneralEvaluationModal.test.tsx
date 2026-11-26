import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionService } from '@/services/session.service';
import type { SessionGeneralEvaluation } from '@/types/session';
import { SessionGeneralEvaluationModal } from './SessionGeneralEvaluationModal';

vi.mock('@/services/session.service', () => ({
  sessionService: {
    saveGeneralEvaluation: vi.fn(),
  },
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

const mockEvaluation: SessionGeneralEvaluation = {
  id: 'eval-1',
  texto: 'Participação ativa da turma no fechamento.',
  autor: { id: 'prof-1', nome: 'Prof. Carlos' },
  criadoEm: '2026-04-12T10:00:00Z',
  editadoEm: '2026-04-12T11:30:00Z',
};

describe('SessionGeneralEvaluationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with title, description, counter and textarea', () => {
    render(
      <SessionGeneralEvaluationModal
        isOpen={true}
        onClose={vi.fn()}
        sessionId="sess-1"
        existingEvaluation={null}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Feedback Geral da Sessão' })).toBeInTheDocument();
    expect(
      screen.getByText('Consolidado de feedback para todos os alunos na sessão'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Comentário Geral/)).toBeInTheDocument();
    expect(screen.getByText('0 / 2000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('prefills existing evaluation and displays last edited timestamp', () => {
    render(
      <SessionGeneralEvaluationModal
        isOpen={true}
        onClose={vi.fn()}
        sessionId="sess-1"
        existingEvaluation={mockEvaluation}
        onSaved={vi.fn()}
      />,
    );

    const textarea = screen.getByLabelText(/Comentário Geral/);
    expect(textarea).toHaveValue('Participação ativa da turma no fechamento.');
    expect(screen.getByText(/Última edição:/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Excluir/i })).not.toBeInTheDocument();
  });

  it('validates empty submission', async () => {
    const user = userEvent.setup();
    render(
      <SessionGeneralEvaluationModal
        isOpen={true}
        onClose={vi.fn()}
        sessionId="sess-1"
        existingEvaluation={null}
        onSaved={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('O comentário geral é obrigatório.')).toBeInTheDocument();
    expect(sessionService.saveGeneralEvaluation).not.toHaveBeenCalled();
  });

  it('submits valid text and calls onSaved and onClose', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const onClose = vi.fn();
    vi.mocked(sessionService.saveGeneralEvaluation).mockResolvedValueOnce({
      ...mockEvaluation,
      texto: 'Novo parecer da turma.',
    });

    render(
      <SessionGeneralEvaluationModal
        isOpen={true}
        onClose={onClose}
        sessionId="sess-1"
        existingEvaluation={null}
        onSaved={onSaved}
      />,
    );

    const textarea = screen.getByLabelText(/Comentário Geral/);
    await user.type(textarea, 'Novo parecer da turma.');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(sessionService.saveGeneralEvaluation).toHaveBeenCalledWith('sess-1', {
        texto: 'Novo parecer da turma.',
      });
      expect(onSaved).toHaveBeenCalledWith(
        expect.objectContaining({ texto: 'Novo parecer da turma.' }),
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('displays API error on submission failure', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionService.saveGeneralEvaluation).mockRejectedValueOnce(
      new Error('Erro no servidor ao salvar feedback.'),
    );

    render(
      <SessionGeneralEvaluationModal
        isOpen={true}
        onClose={vi.fn()}
        sessionId="sess-1"
        existingEvaluation={null}
        onSaved={vi.fn()}
      />,
    );

    const textarea = screen.getByLabelText(/Comentário Geral/);
    await user.type(textarea, 'Texto de teste.');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Erro no servidor ao salvar feedback.')).toBeInTheDocument();
  });
});
