import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { StudentFeedbackModal } from './StudentFeedbackModal';
import { feedbackService } from '@/services/feedback.service';
import type { StudentGradeRow } from '@/types/grades';
import type { StudentProblemFeedbackResponse } from '@/types/feedback';

vi.mock('@/services/feedback.service', () => ({
  feedbackService: {
    saveStudentFeedback: vi.fn(),
  },
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

const mockStudent: StudentGradeRow = {
  alunoId: 'aluno-1',
  nome: 'Ana Silva',
  matricula: '26121190',
  sessoes: [],
  notaFinal: 8.5,
};

describe('StudentFeedbackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inherits privacy behavior: displays student name when hideNames is false', () => {
    render(
      <StudentFeedbackModal
        isOpen={true}
        onClose={vi.fn()}
        student={mockStudent}
        existingFeedback={null}
        hideNames={false}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Ana Silva' })).toBeInTheDocument();
    expect(screen.getByText('Matrícula: 26121190')).toBeInTheDocument();
  });

  it('inherits privacy behavior: displays only matricula in header when hideNames is true', () => {
    render(
      <StudentFeedbackModal
        isOpen={true}
        onClose={vi.fn()}
        student={mockStudent}
        existingFeedback={null}
        hideNames={true}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: '26121190' })).toBeInTheDocument();
    expect(screen.queryByText('Ana Silva')).not.toBeInTheDocument();
  });

  it('validates required fields preventing empty submit and bounds checking on grade', async () => {
    const user = userEvent.setup();

    render(
      <StudentFeedbackModal
        isOpen={true}
        onClose={vi.fn()}
        student={mockStudent}
        existingFeedback={null}
        hideNames={false}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );

    const saveButton = screen.getByRole('button', { name: 'Salvar' });
    await user.click(saveButton);

    expect(screen.getByText('A nota é obrigatória.')).toBeInTheDocument();
    expect(screen.getByText('O comentário de feedback é obrigatório.')).toBeInTheDocument();
    expect(feedbackService.saveStudentFeedback).not.toHaveBeenCalled();

    // Out of range grade
    const gradeInput = screen.getByLabelText(/nota/i);
    await user.type(gradeInput, '15');
    await user.click(saveButton);

    expect(screen.getByText('A nota deve estar entre 0 e 10.')).toBeInTheDocument();
  });

  it('submits valid payload reflecting the database entity with escopo ALUNO, destinatario_id, nota, and texto', async () => {
    const user = userEvent.setup();
    const handleSaved = vi.fn();
    const handleClose = vi.fn();

    const mockSavedResponse: StudentProblemFeedbackResponse = {
      id: 'fb-1',
      escopo: 'ALUNO',
      destinatarioId: 'aluno-1',
      nota: 8.5,
      texto: 'Ótima participação e fundamentação.',
      criadoEm: '2026-10-11T12:00:00Z',
      editadoEm: null,
    };

    vi.mocked(feedbackService.saveStudentFeedback).mockResolvedValue(mockSavedResponse);

    render(
      <StudentFeedbackModal
        isOpen={true}
        onClose={handleClose}
        student={mockStudent}
        existingFeedback={null}
        hideNames={false}
        roomId="room-1"
        problemId="prob-1"
        onSaved={handleSaved}
      />,
    );

    const gradeInput = screen.getByLabelText(/nota/i);
    const commentInput = screen.getByLabelText(/comentário de feedback/i);
    const saveButton = screen.getByRole('button', { name: 'Salvar' });

    await user.type(gradeInput, '8.5');
    await user.type(commentInput, 'Ótima participação e fundamentação.');
    await user.click(saveButton);

    expect(feedbackService.saveStudentFeedback).toHaveBeenCalledWith(
      'room-1',
      'prob-1',
      'aluno-1',
      {
        escopo: 'ALUNO',
        destinatario_id: 'aluno-1',
        nota: 8.5,
        texto: 'Ótima participação e fundamentação.',
      },
    );

    expect(handleSaved).toHaveBeenCalledWith(mockSavedResponse);
    expect(handleClose).toHaveBeenCalled();
  });

  it('keeps entered data in modal and does not close on API error', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    vi.mocked(feedbackService.saveStudentFeedback).mockRejectedValue(
      new Error('Erro de conexão com o servidor'),
    );

    render(
      <StudentFeedbackModal
        isOpen={true}
        onClose={handleClose}
        student={mockStudent}
        existingFeedback={null}
        hideNames={false}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );

    const gradeInput = screen.getByLabelText(/nota/i);
    const commentInput = screen.getByLabelText(/comentário de feedback/i);
    const saveButton = screen.getByRole('button', { name: 'Salvar' });

    await user.type(gradeInput, '9.0');
    await user.type(commentInput, 'Comentário teste preservado.');
    await user.click(saveButton);

    expect(screen.getByText('Erro de conexão com o servidor')).toBeInTheDocument();
    expect(handleClose).not.toHaveBeenCalled();
    expect(gradeInput).toHaveValue(9.0);
    expect(commentInput).toHaveValue('Comentário teste preservado.');
  });

  it('renders last edition date when editing an existing feedback', () => {
    const existingFeedback: StudentProblemFeedbackResponse = {
      id: 'fb-1',
      escopo: 'ALUNO',
      destinatarioId: 'aluno-1',
      nota: 7.5,
      texto: 'Feedback anterior.',
      criadoEm: '2026-10-01T10:00:00Z',
      editadoEm: '2026-10-05T14:30:00Z',
    };

    render(
      <StudentFeedbackModal
        isOpen={true}
        onClose={vi.fn()}
        student={mockStudent}
        existingFeedback={existingFeedback}
        hideNames={false}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByText(/Última edição em:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nota/i)).toHaveValue(7.5);
    expect(screen.getByLabelText(/comentário de feedback/i)).toHaveValue('Feedback anterior.');
  });
});
