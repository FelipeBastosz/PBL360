import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { feedbackService } from '@/services/feedback.service';
import type { GeneralFeedbackResponse } from '@/types/feedback';
import {
  MAX_GENERAL_FEEDBACK_LENGTH,
  validateGeneralFeedbackText,
} from '../hooks/useProblemGeneralFeedbackForm';
import { ProblemGeneralFeedbackModal } from './ProblemGeneralFeedbackModal';

vi.mock('@/services/feedback.service', () => ({
  feedbackService: {
    saveGeneralFeedback: vi.fn(),
  },
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

describe('ProblemGeneralFeedbackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal, character counter, and no individual grade or student fields', () => {
    render(
      <ProblemGeneralFeedbackModal
        isOpen={true}
        onClose={vi.fn()}
        existingFeedback={null}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Feedback Geral da Turma' })).toBeInTheDocument();
    const textarea = screen.getByLabelText(/comentário geral/i);
    expect(screen.getByText('Comentário Geral').textContent?.trim()).toBe('Comentário Geral');
    expect(textarea).toHaveAttribute('maxLength', String(MAX_GENERAL_FEEDBACK_LENGTH));
    expect(textarea).toHaveAttribute('aria-describedby', 'problem-general-feedback-counter');
    expect(screen.getByText(`0 / ${MAX_GENERAL_FEEDBACK_LENGTH}`)).toBeInTheDocument();
    expect(screen.queryByLabelText(/nota/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/aluno/i)).not.toBeInTheDocument();
  });

  it('allows clearing existing feedback to 0 characters and calls onSaved with null', async () => {
    const user = userEvent.setup();
    const handleSaved = vi.fn();
    const handleClose = vi.fn();
    const existingFeedback: GeneralFeedbackResponse = {
      id: 'fb-gen-1',
      escopo: 'PROBLEMA',
      texto: 'Parecer anterior da turma.',
      criadoEm: '2026-10-01T10:00:00Z',
      editadoEm: null,
    };
    vi.mocked(feedbackService.saveGeneralFeedback).mockResolvedValueOnce(null);

    render(
      <ProblemGeneralFeedbackModal
        isOpen={true}
        onClose={handleClose}
        existingFeedback={existingFeedback}
        roomId="room-1"
        problemId="prob-1"
        onSaved={handleSaved}
      />,
    );

    const textarea = screen.getByLabelText(/comentário geral/i);
    await user.clear(textarea);
    expect(screen.getByText(`0 / ${MAX_GENERAL_FEEDBACK_LENGTH}`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(handleSaved).toHaveBeenCalledWith(null);
    });
    expect(feedbackService.saveGeneralFeedback).toHaveBeenCalledWith('room-1', 'prob-1', {
      texto: '',
    });
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'success',
      message: 'Feedback geral removido com sucesso!',
    });
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it('validates maximum character limit aligned with backend (2000 chars) and accepts empty text', () => {
    expect(validateGeneralFeedbackText('')).toBeNull();
    expect(validateGeneralFeedbackText('   ')).toBeNull();
    expect(validateGeneralFeedbackText('a'.repeat(MAX_GENERAL_FEEDBACK_LENGTH))).toBeNull();
    expect(validateGeneralFeedbackText('a'.repeat(MAX_GENERAL_FEEDBACK_LENGTH + 1))).toBe(
      `O comentário de feedback geral deve ter no máximo ${MAX_GENERAL_FEEDBACK_LENGTH} caracteres.`,
    );
  });

  it('creates first general feedback sending only general text payload and disables buttons while saving', async () => {
    const user = userEvent.setup();
    const handleSaved = vi.fn();
    const handleClose = vi.fn();

    let resolveRequest!: (value: GeneralFeedbackResponse) => void;
    vi.mocked(feedbackService.saveGeneralFeedback).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    render(
      <ProblemGeneralFeedbackModal
        isOpen={true}
        onClose={handleClose}
        existingFeedback={null}
        roomId="room-1"
        problemId="prob-1"
        onSaved={handleSaved}
      />,
    );

    const textarea = screen.getByLabelText(/comentário geral/i);
    await user.type(textarea, 'Excelente maturidade da turma.');
    expect(screen.getByText(`30 / ${MAX_GENERAL_FEEDBACK_LENGTH}`)).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: 'Salvar' });
    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(saveBtn);

    expect(saveBtn).toBeDisabled();
    expect(cancelBtn).toBeDisabled();
    expect(textarea).toBeDisabled();

    const savedResponse: GeneralFeedbackResponse = {
      id: 'fb-general-1',
      escopo: 'PROBLEMA',
      texto: 'Excelente maturidade da turma.',
      criadoEm: '2026-10-11T12:00:00Z',
      editadoEm: null,
    };
    resolveRequest(savedResponse);

    await waitFor(() => {
      expect(handleSaved).toHaveBeenCalledWith(savedResponse);
    });

    expect(feedbackService.saveGeneralFeedback).toHaveBeenCalledWith('room-1', 'prob-1', {
      texto: 'Excelente maturidade da turma.',
    });
    const sentPayload = vi.mocked(feedbackService.saveGeneralFeedback).mock.calls[0][2];
    expect(sentPayload).not.toHaveProperty('alunoId');
    expect(sentPayload).not.toHaveProperty('destinatario_id');
    expect(sentPayload).not.toHaveProperty('nota');

    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'success',
      message: 'Feedback geral salvo com sucesso!',
    });
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it('loads existing feedback, shows last edited metadata, and allows editing', async () => {
    const user = userEvent.setup();
    const handleSaved = vi.fn();
    const existingFeedback: GeneralFeedbackResponse = {
      id: 'fb-gen-1',
      escopo: 'PROBLEMA',
      texto: 'Comentário original.',
      criadoEm: '2026-10-01T10:00:00Z',
      editadoEm: '2026-10-12T15:30:00Z',
    };
    const updatedFeedback: GeneralFeedbackResponse = {
      ...existingFeedback,
      texto: 'Comentário atualizado.',
      editadoEm: '2026-10-13T11:00:00Z',
    };
    vi.mocked(feedbackService.saveGeneralFeedback).mockResolvedValue(updatedFeedback);

    render(
      <ProblemGeneralFeedbackModal
        isOpen={true}
        onClose={vi.fn()}
        existingFeedback={existingFeedback}
        roomId="room-1"
        problemId="prob-1"
        onSaved={handleSaved}
      />,
    );

    const textarea = screen.getByLabelText(/comentário geral/i);
    expect(textarea).toHaveValue('Comentário original.');
    expect(screen.getByText(/Última edição:/i)).toBeInTheDocument();

    await user.clear(textarea);
    await user.type(textarea, 'Comentário atualizado.');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(handleSaved).toHaveBeenCalledWith(updatedFeedback);
    });
    expect(feedbackService.saveGeneralFeedback).toHaveBeenCalledWith('room-1', 'prob-1', {
      texto: 'Comentário atualizado.',
    });
  });

  it('discards unsaved edits on Cancelar without sending PUT and restores original text on reopen', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const existingFeedback: GeneralFeedbackResponse = {
      id: 'fb-gen-1',
      escopo: 'PROBLEMA',
      texto: 'Texto salvo anteriormente.',
      criadoEm: '2026-10-01T10:00:00Z',
      editadoEm: null,
    };

    const { rerender } = render(
      <ProblemGeneralFeedbackModal
        isOpen={true}
        onClose={handleClose}
        existingFeedback={existingFeedback}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );

    const textarea = screen.getByLabelText(/comentário geral/i);
    await user.type(textarea, ' Alteração descartada.');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(handleClose).toHaveBeenCalledOnce();
    expect(feedbackService.saveGeneralFeedback).not.toHaveBeenCalled();

    rerender(
      <ProblemGeneralFeedbackModal
        isOpen={false}
        onClose={handleClose}
        existingFeedback={existingFeedback}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );
    rerender(
      <ProblemGeneralFeedbackModal
        isOpen={true}
        onClose={handleClose}
        existingFeedback={existingFeedback}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/comentário geral/i)).toHaveValue('Texto salvo anteriormente.');
  });

  it('shows error alert without losing typed text when PUT fails and allows retrying', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSaved = vi.fn();

    vi.mocked(feedbackService.saveGeneralFeedback).mockRejectedValueOnce(
      new Error('Falha temporária no servidor.'),
    );

    render(
      <ProblemGeneralFeedbackModal
        isOpen={true}
        onClose={handleClose}
        existingFeedback={null}
        roomId="room-1"
        problemId="prob-1"
        onSaved={handleSaved}
      />,
    );

    const textarea = screen.getByLabelText(/comentário geral/i);
    await user.type(textarea, 'Texto que não deve ser perdido.');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha temporária no servidor.');
    expect(handleClose).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Texto que não deve ser perdido.');

    const savedResponse: GeneralFeedbackResponse = {
      id: 'fb-retry',
      escopo: 'PROBLEMA',
      texto: 'Texto que não deve ser perdido.',
      criadoEm: '2026-10-11T12:00:00Z',
      editadoEm: null,
    };
    vi.mocked(feedbackService.saveGeneralFeedback).mockResolvedValueOnce(savedResponse);

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(handleSaved).toHaveBeenCalledWith(savedResponse);
    });
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it('displays loading spinner and load error retry state when fetching initial feedback', async () => {
    const user = userEvent.setup();
    const onRetryLoad = vi.fn();

    const { rerender } = render(
      <ProblemGeneralFeedbackModal
        isOpen={true}
        onClose={vi.fn()}
        existingFeedback={null}
        isLoading={true}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(
      <ProblemGeneralFeedbackModal
        isOpen={true}
        onClose={vi.fn()}
        existingFeedback={null}
        isLoading={false}
        loadError="Não foi possível carregar o feedback geral da turma."
        onRetryLoad={onRetryLoad}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o feedback geral da turma.',
    );
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetryLoad).toHaveBeenCalledOnce();
  });
});
