import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GeneralFeedbackModal } from './GeneralFeedbackModal';
import { feedbackService } from '@/services/feedback.service';
import type { GeneralFeedbackResponse } from '@/types/feedback';

vi.mock('@/services/feedback.service', () => ({
  feedbackService: {
    saveGeneralFeedback: vi.fn(),
  },
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

describe('GeneralFeedbackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal title and does not have numeric grade input', () => {
    render(
      <GeneralFeedbackModal
        isOpen={true}
        onClose={vi.fn()}
        existingFeedback={null}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Feedback Geral da Turma' })).toBeInTheDocument();
    expect(screen.getByLabelText(/comentário geral/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/nota/i)).not.toBeInTheDocument();
  });

  it('validates required comment preventing empty submit', async () => {
    const user = userEvent.setup();

    render(
      <GeneralFeedbackModal
        isOpen={true}
        onClose={vi.fn()}
        existingFeedback={null}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );

    const saveButton = screen.getByRole('button', { name: 'Salvar' });
    await user.click(saveButton);

    expect(screen.getByText('O comentário de feedback geral é obrigatório.')).toBeInTheDocument();
    expect(feedbackService.saveGeneralFeedback).not.toHaveBeenCalled();
  });

  it('submits payload with escopo PROBLEMA, destinatario_id null, nota null, and texto', async () => {
    const user = userEvent.setup();
    const handleSaved = vi.fn();
    const handleClose = vi.fn();

    const mockSavedResponse: GeneralFeedbackResponse = {
      id: 'fb-general',
      escopo: 'PROBLEMA',
      texto: 'A turma desenvolveu excelente maturidade nas discussões.',
      criadoEm: '2026-10-11T12:00:00Z',
      editadoEm: null,
    };

    vi.mocked(feedbackService.saveGeneralFeedback).mockResolvedValue(mockSavedResponse);

    render(
      <GeneralFeedbackModal
        isOpen={true}
        onClose={handleClose}
        existingFeedback={null}
        roomId="room-1"
        problemId="prob-1"
        onSaved={handleSaved}
      />,
    );

    const commentInput = screen.getByLabelText(/comentário geral/i);
    const saveButton = screen.getByRole('button', { name: 'Salvar' });

    await user.type(commentInput, 'A turma desenvolveu excelente maturidade nas discussões.');
    await user.click(saveButton);

    expect(feedbackService.saveGeneralFeedback).toHaveBeenCalledWith('room-1', 'prob-1', {
      escopo: 'PROBLEMA',
      destinatario_id: null,
      nota: null,
      texto: 'A turma desenvolveu excelente maturidade nas discussões.',
    });

    expect(handleSaved).toHaveBeenCalledWith(mockSavedResponse);
    expect(handleClose).toHaveBeenCalled();
  });

  it('keeps data in modal and does not close on API error', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    vi.mocked(feedbackService.saveGeneralFeedback).mockRejectedValue(
      new Error('Erro interno ao salvar feedback'),
    );

    render(
      <GeneralFeedbackModal
        isOpen={true}
        onClose={handleClose}
        existingFeedback={null}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );

    const commentInput = screen.getByLabelText(/comentário geral/i);
    const saveButton = screen.getByRole('button', { name: 'Salvar' });

    await user.type(commentInput, 'Comentário geral a ser mantido.');
    await user.click(saveButton);

    expect(screen.getByText('Erro interno ao salvar feedback')).toBeInTheDocument();
    expect(handleClose).not.toHaveBeenCalled();
    expect(commentInput).toHaveValue('Comentário geral a ser mantido.');
  });

  it('renders last edition date formatted in footer when updatedAt or editadoEm is present', () => {
    const existingFeedback: GeneralFeedbackResponse = {
      id: 'fb-gen-1',
      escopo: 'PROBLEMA',
      texto: 'Comentário existente da turma.',
      criadoEm: '2026-10-01T10:00:00Z',
      editadoEm: '2026-10-12T15:30:00Z',
      updatedAt: '2026-10-12T15:30:00Z',
    };

    render(
      <GeneralFeedbackModal
        isOpen={true}
        onClose={vi.fn()}
        existingFeedback={existingFeedback}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );

    const footerText = screen.getByText(/Última edição/i);
    expect(footerText).toBeInTheDocument();
    expect(footerText).toHaveClass('text-sm');
    expect(footerText).toHaveClass('text-gray-500');
  });
});
