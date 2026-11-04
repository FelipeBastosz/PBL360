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

    expect(screen.getByText(/Última edição/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nota do aluno/i)).toHaveValue('7,5');
    expect(screen.getByLabelText(/nova nota/i)).toHaveValue(7.5);
    expect(screen.getByLabelText(/justificativa do ajuste/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/comentário de feedback/i)).toHaveValue('Feedback anterior.');
  });

  it('displays session name in modal title when sessionName or evaluation is provided', () => {
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
        sessionName="Sessão 01"
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Feedback - Sessão 01' })).toBeInTheDocument();
  });

  it('pre-fills modal inputs with currentGrade and currentFeedback from evaluation context', () => {
    const existingFeedback: StudentProblemFeedbackResponse = {
      id: 'fb-sess-1',
      escopo: 'ALUNO',
      destinatarioId: 'aluno-1',
      sessaoId: 'sess-1',
      nota: 9.2,
      texto: 'Participação ativa nas etapas.',
      criadoEm: '2026-10-10T10:00:00Z',
      editadoEm: '2026-10-12T15:30:00Z',
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
        evaluation={{
          studentId: 'aluno-1',
          sessionId: 'sess-1',
          sessionName: 'Sessão 01',
          currentGrade: 9.2,
          currentFeedback: 'Participação ativa nas etapas.',
          updatedAt: '2026-10-12T15:30:00Z',
          existingFeedback,
        }}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Feedback - Sessão 01' })).toBeInTheDocument();
    expect(screen.getByLabelText(/nota do aluno/i)).toHaveValue('9,2');
    expect(screen.getByLabelText(/nova nota/i)).toHaveValue(9.2);
    expect(screen.getByLabelText(/comentário de feedback/i)).toHaveValue(
      'Participação ativa nas etapas.',
    );
    expect(screen.getByText(/Última edição/i)).toBeInTheDocument();
  });

  it('does not render adjustment layout when evaluation has calculated grade but no existing feedback on this session', () => {
    const s1Feedback: StudentProblemFeedbackResponse = {
      id: 'fb-sess-1',
      escopo: 'ALUNO',
      destinatarioId: 'aluno-1',
      sessaoId: 'sess-1',
      nota: 10.0,
      texto: 'Feedback da Sessão 1',
      criadoEm: '2026-10-10T10:00:00Z',
      editadoEm: null,
    };

    render(
      <StudentFeedbackModal
        isOpen={true}
        onClose={vi.fn()}
        student={mockStudent}
        existingFeedback={s1Feedback} // Belongs to sess-1, but modal is opening for sess-2
        hideNames={false}
        roomId="room-1"
        problemId="prob-1"
        onSaved={vi.fn()}
        evaluation={{
          studentId: 'aluno-1',
          sessionId: 'sess-2',
          sessionName: 'Sessão 02',
          currentGrade: 8.2,
          currentFeedback: null,
          updatedAt: null,
          existingFeedback: null,
        }}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Feedback - Sessão 02' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/justificativa do ajuste/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/nota do aluno/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/nota/i)).toHaveValue(8.2);
  });

  it('does not render justification field when registering feedback for the first time', () => {
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

    expect(screen.queryByLabelText(/justificativa do ajuste/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/nota do aluno/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/nota/i)).toBeInTheDocument();
  });

  it('requires justification with at least 10 characters when altering an existing grade', async () => {
    const user = userEvent.setup();
    const existingFeedback: StudentProblemFeedbackResponse = {
      id: 'fb-1',
      escopo: 'ALUNO',
      destinatarioId: 'aluno-1',
      nota: 7.5,
      texto: 'Feedback anterior.',
      criadoEm: '2026-10-01T10:00:00Z',
      editadoEm: null,
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

    const newGradeInput = screen.getByLabelText(/nova nota/i);
    const saveButton = screen.getByRole('button', { name: 'Salvar' });

    await user.clear(newGradeInput);
    await user.type(newGradeInput, '8.5');
    await user.click(saveButton);

    expect(screen.getByText('A justificativa do ajuste é obrigatória.')).toBeInTheDocument();
    expect(feedbackService.saveStudentFeedback).not.toHaveBeenCalled();

    const justificationInput = screen.getByLabelText(/justificativa do ajuste/i);
    await user.type(justificationInput, 'Curto');
    await user.click(saveButton);

    expect(
      screen.getByText('A justificativa deve ter no mínimo 10 caracteres.'),
    ).toBeInTheDocument();
    expect(feedbackService.saveStudentFeedback).not.toHaveBeenCalled();
  });

  it('submits payload with justificativa when modifying grade with valid justification', async () => {
    const user = userEvent.setup();
    const handleSaved = vi.fn();
    const handleClose = vi.fn();
    const existingFeedback: StudentProblemFeedbackResponse = {
      id: 'fb-1',
      escopo: 'ALUNO',
      destinatarioId: 'aluno-1',
      nota: 7.5,
      texto: 'Feedback anterior.',
      criadoEm: '2026-10-01T10:00:00Z',
      editadoEm: null,
    };

    const mockSavedResponse: StudentProblemFeedbackResponse = {
      ...existingFeedback,
      nota: 9.0,
      editadoEm: '2026-10-15T12:00:00Z',
    };

    vi.mocked(feedbackService.saveStudentFeedback).mockResolvedValue(mockSavedResponse);

    render(
      <StudentFeedbackModal
        isOpen={true}
        onClose={handleClose}
        student={mockStudent}
        existingFeedback={existingFeedback}
        hideNames={false}
        roomId="room-1"
        problemId="prob-1"
        onSaved={handleSaved}
      />,
    );

    const newGradeInput = screen.getByLabelText(/nova nota/i);
    const justificationInput = screen.getByLabelText(/justificativa do ajuste/i);
    const saveButton = screen.getByRole('button', { name: 'Salvar' });

    await user.clear(newGradeInput);
    await user.type(newGradeInput, '9.0');
    await user.type(
      justificationInput,
      'Ajuste de nota após revisão do relatório da sessão de tutoria.',
    );
    await user.click(saveButton);

    expect(feedbackService.saveStudentFeedback).toHaveBeenCalledWith(
      'room-1',
      'prob-1',
      'aluno-1',
      {
        escopo: 'ALUNO',
        destinatario_id: 'aluno-1',
        nota: 9.0,
        texto: 'Feedback anterior.',
        justificativa: 'Ajuste de nota após revisão do relatório da sessão de tutoria.',
      },
    );
    expect(handleSaved).toHaveBeenCalledWith(mockSavedResponse);
    expect(handleClose).toHaveBeenCalled();
  });

  it('does not require justification when only modifying feedback comment on existing grade', async () => {
    const user = userEvent.setup();
    const handleSaved = vi.fn();
    const handleClose = vi.fn();
    const existingFeedback: StudentProblemFeedbackResponse = {
      id: 'fb-1',
      escopo: 'ALUNO',
      destinatarioId: 'aluno-1',
      nota: 7.5,
      texto: 'Feedback anterior.',
      criadoEm: '2026-10-01T10:00:00Z',
      editadoEm: null,
    };

    const mockSavedResponse: StudentProblemFeedbackResponse = {
      ...existingFeedback,
      texto: 'Feedback atualizado com mais detalhes pertinentes.',
      editadoEm: '2026-10-15T12:00:00Z',
    };

    vi.mocked(feedbackService.saveStudentFeedback).mockResolvedValue(mockSavedResponse);

    render(
      <StudentFeedbackModal
        isOpen={true}
        onClose={handleClose}
        student={mockStudent}
        existingFeedback={existingFeedback}
        hideNames={false}
        roomId="room-1"
        problemId="prob-1"
        onSaved={handleSaved}
      />,
    );

    const commentInput = screen.getByLabelText(/comentário de feedback/i);
    const saveButton = screen.getByRole('button', { name: 'Salvar' });

    await user.clear(commentInput);
    await user.type(commentInput, 'Feedback atualizado com mais detalhes pertinentes.');
    await user.click(saveButton);

    expect(feedbackService.saveStudentFeedback).toHaveBeenCalledWith(
      'room-1',
      'prob-1',
      'aluno-1',
      {
        escopo: 'ALUNO',
        destinatario_id: 'aluno-1',
        nota: 7.5,
        texto: 'Feedback atualizado com mais detalhes pertinentes.',
      },
    );
    expect(handleSaved).toHaveBeenCalledWith(mockSavedResponse);
    expect(handleClose).toHaveBeenCalled();
  });

  it('pre-populates existing justification and note when reopening feedback with justification', () => {
    const existingFeedback: StudentProblemFeedbackResponse = {
      id: 'fb-1',
      escopo: 'ALUNO',
      destinatarioId: 'aluno-1',
      nota: 8.8,
      texto: 'Feedback com justificativa prévia.',
      criadoEm: '2026-10-01T10:00:00Z',
      editadoEm: '2026-10-05T14:30:00Z',
      justificativa: 'Justificativa anterior gravada no banco.',
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

    expect(screen.getByLabelText(/nota do aluno/i)).toHaveValue('8,8');
    expect(screen.getByLabelText(/nova nota/i)).toHaveValue(8.8);
    expect(screen.getByLabelText(/justificativa do ajuste/i)).toHaveValue(
      'Justificativa anterior gravada no banco.',
    );
  });

  it('includes sessao_id when saving feedback opened from a session evaluation cell', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const mockSavedResponse: StudentProblemFeedbackResponse = {
      id: 'fb-1',
      escopo: 'ALUNO',
      destinatarioId: 'aluno-1',
      nota: 8.0,
      texto: 'Comentário da sessão.',
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
        onSaved={vi.fn()}
        evaluation={{
          studentId: 'aluno-1',
          sessionId: 'session-42',
          sessionName: 'Sessão 01',
          currentGrade: null,
          currentFeedback: null,
          updatedAt: null,
        }}
      />,
    );

    const gradeInput = screen.getByLabelText(/nota/i);
    const commentInput = screen.getByLabelText(/comentário de feedback/i);
    const saveButton = screen.getByRole('button', { name: 'Salvar' });

    await user.type(gradeInput, '8.0');
    await user.type(commentInput, 'Comentário da sessão.');
    await user.click(saveButton);

    expect(feedbackService.saveStudentFeedback).toHaveBeenCalledWith(
      'room-1',
      'prob-1',
      'aluno-1',
      {
        escopo: 'ALUNO',
        destinatario_id: 'aluno-1',
        sessao_id: 'session-42',
        nota: 8.0,
        texto: 'Comentário da sessão.',
      },
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it('correctly handles grade 0 as existing grade without treating it as falsy', () => {
    const existingFeedback: StudentProblemFeedbackResponse = {
      id: 'fb-0',
      escopo: 'ALUNO',
      destinatarioId: 'aluno-1',
      sessaoId: 'session-zero',
      nota: 0,
      texto: 'Aluno não pontuou nesta sessão.',
      criadoEm: '2026-10-11T12:00:00Z',
      editadoEm: null,
      justificativa: 'Ausência não justificada na atividade.',
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
        evaluation={{
          studentId: 'aluno-1',
          sessionId: 'session-zero',
          sessionName: 'Sessão 0',
          currentGrade: 0,
          currentFeedback: 'Aluno não pontuou nesta sessão.',
          updatedAt: null,
          existingFeedback,
        }}
      />,
    );

    // Should render the adjustment layout with current grade "0,0" and new grade 0
    expect(screen.getByLabelText(/nota do aluno/i)).toHaveValue('0,0');
    expect(screen.getByLabelText(/nova nota/i)).toHaveValue(0);
    expect(screen.getByLabelText(/comentário de feedback/i)).toHaveValue(
      'Aluno não pontuou nesta sessão.',
    );
    expect(screen.getByLabelText(/justificativa do ajuste/i)).toHaveValue(
      'Ausência não justificada na atividade.',
    );
  });
});
