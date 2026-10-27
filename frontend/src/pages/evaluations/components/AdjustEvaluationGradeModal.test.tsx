import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AdjustEvaluationGradeModal, type AdjustStudentInfo } from './AdjustEvaluationGradeModal';

describe('AdjustEvaluationGradeModal', () => {
  const mockStudent: AdjustStudentInfo = {
    alunoId: 'student-1',
    nome: 'Elisa Nunes',
    matricula: '26121194',
    notaAluno: 8.0,
    notaVigente: 8.0,
  };

  it('does not render when isOpen is false', () => {
    render(
      <AdjustEvaluationGradeModal
        isOpen={false}
        student={mockStudent}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('Renderização base e Privacidade', () => {
    it('displays the student name when hideNames is false', () => {
      render(
        <AdjustEvaluationGradeModal
          isOpen={true}
          student={mockStudent}
          hideNames={false}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      expect(screen.getByRole('heading', { name: 'Elisa Nunes' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: '26121194' })).not.toBeInTheDocument();
      expect(screen.getByText('EN')).toBeInTheDocument();
      expect(screen.getByLabelText('Nota do aluno')).toHaveValue('8,0');
      expect(screen.getByLabelText('Nova nota')).toHaveValue(8);
    });

    it('displays the student matricula and hides the student name when hideNames is true', () => {
      render(
        <AdjustEvaluationGradeModal
          isOpen={true}
          student={mockStudent}
          hideNames={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      expect(screen.getByRole('heading', { name: '26121194' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Elisa Nunes' })).not.toBeInTheDocument();
      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    it('displays "Sem matrícula" when hideNames is true and matricula is null', () => {
      render(
        <AdjustEvaluationGradeModal
          isOpen={true}
          student={{ ...mockStudent, matricula: null }}
          hideNames={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      expect(screen.getByRole('heading', { name: 'Sem matrícula' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Elisa Nunes' })).not.toBeInTheDocument();
    });
  });

  describe('Validação de Input (Botão Desabilitado)', () => {
    it('disables "Salvar ajuste" button upon opening (grade unchanged and no justification)', () => {
      render(
        <AdjustEvaluationGradeModal
          isOpen={true}
          student={mockStudent}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      const saveButton = screen.getByRole('button', { name: 'Salvar ajuste' });
      expect(saveButton).toBeDisabled();
      expect(screen.getByText('0 / 500')).toBeInTheDocument();
    });

    it('keeps button disabled when grade changes but justification has less than 10 characters', async () => {
      render(
        <AdjustEvaluationGradeModal
          isOpen={true}
          student={mockStudent}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      const gradeInput = screen.getByLabelText('Nova nota');
      const justificationInput = screen.getByLabelText(/justificativa do ajuste/i);
      const saveButton = screen.getByRole('button', { name: 'Salvar ajuste' });

      await userEvent.clear(gradeInput);
      await userEvent.type(gradeInput, '9.5');
      await userEvent.type(justificationInput, 'Curto');

      expect(saveButton).toBeDisabled();
      expect(screen.getByText('Mínimo de 10 caracteres')).toBeInTheDocument();
      expect(screen.getByText('5 / 500')).toBeInTheDocument();
    });

    it('keeps button disabled when justification is valid but grade is not changed', async () => {
      render(
        <AdjustEvaluationGradeModal
          isOpen={true}
          student={mockStudent}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      const justificationInput = screen.getByLabelText(/justificativa do ajuste/i);
      const saveButton = screen.getByRole('button', { name: 'Salvar ajuste' });

      await userEvent.type(
        justificationInput,
        'Participação excepcional em todas as discussões do caso.',
      );

      expect(saveButton).toBeDisabled();
    });
  });

  describe('Validação de Sucesso e Submissão', () => {
    it('enables the button when both new grade differs and justification has at least 10 characters', async () => {
      render(
        <AdjustEvaluationGradeModal
          isOpen={true}
          student={mockStudent}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      const gradeInput = screen.getByLabelText('Nova nota');
      const justificationInput = screen.getByLabelText(/justificativa do ajuste/i);
      const saveButton = screen.getByRole('button', { name: 'Salvar ajuste' });

      await userEvent.clear(gradeInput);
      await userEvent.type(gradeInput, '8.5');
      await userEvent.type(
        justificationInput,
        'Demonstrou clareza e síntese precisa durante o fechamento do problema.',
      );

      expect(saveButton).toBeEnabled();
    });

    it('submits the correct payload when clicking "Salvar ajuste"', async () => {
      const onSubmit = vi.fn();
      render(
        <AdjustEvaluationGradeModal
          isOpen={true}
          student={mockStudent}
          onClose={vi.fn()}
          onSubmit={onSubmit}
        />,
      );

      const gradeInput = screen.getByLabelText('Nova nota');
      const justificationInput = screen.getByLabelText(/justificativa do ajuste/i);
      const saveButton = screen.getByRole('button', { name: 'Salvar ajuste' });

      await userEvent.clear(gradeInput);
      await userEvent.type(gradeInput, '7.5');
      await userEvent.type(
        justificationInput,
        'Critérios revisados após verificação dos apontamentos da mesa.',
      );

      await userEvent.click(saveButton);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith({
        novaNota: 7.5,
        justificativa: 'Critérios revisados após verificação dos apontamentos da mesa.',
      });
    });

    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(
        <AdjustEvaluationGradeModal
          isOpen={true}
          student={mockStudent}
          onClose={onClose}
          onSubmit={vi.fn()}
        />,
      );

      await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
