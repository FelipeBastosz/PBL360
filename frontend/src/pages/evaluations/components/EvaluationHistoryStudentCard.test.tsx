import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EvaluationHistoryStudentCard } from './EvaluationHistoryStudentCard';
import type { StudentEvaluationHistoryItem } from '@/types/evaluation';

describe('EvaluationHistoryStudentCard', () => {
  const unadjustedStudent: StudentEvaluationHistoryItem = {
    alunoId: 'student-1',
    nome: 'Elisa Nunes',
    matricula: '26121194',
    notaAluno: 8.0,
    notaAlunoOriginal: null,
    notaTutor: null,
    notaPares: null,
    avaliacoesPares: 0,
    situacaoAjuste: 'SEM_AJUSTE',
  };

  const adjustedStudent: StudentEvaluationHistoryItem = {
    alunoId: 'student-2',
    nome: 'Carla Rocha',
    matricula: '26121192',
    notaAluno: 8.5,
    notaAlunoOriginal: 9.5,
    notaTutor: 8.5,
    notaPares: null,
    avaliacoesPares: 0,
    situacaoAjuste: 'AJUSTADA',
  };

  it('renders student name when hideNames is false', () => {
    render(
      <EvaluationHistoryStudentCard
        student={unadjustedStudent}
        hideNames={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Elisa Nunes')).toBeInTheDocument();
    expect(screen.getByText('Sem ajuste do tutor')).toBeInTheDocument();
    expect(screen.getByText('8,0')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders matricula when hideNames is true', () => {
    render(
      <EvaluationHistoryStudentCard
        student={unadjustedStudent}
        hideNames={true}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('26121194')).toBeInTheDocument();
    expect(screen.queryByText('Elisa Nunes')).not.toBeInTheDocument();
  });

  it('renders fallback label and does not leak name when hideNames is true and matricula is null', () => {
    render(
      <EvaluationHistoryStudentCard
        student={{ ...unadjustedStudent, matricula: null }}
        hideNames={true}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Sem matrícula')).toBeInTheDocument();
    expect(screen.queryByText('Elisa Nunes')).not.toBeInTheDocument();
  });

  it('renders adjusted state with checkmark and both scores', () => {
    render(
      <EvaluationHistoryStudentCard
        student={adjustedStudent}
        hideNames={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Carla Rocha')).toBeInTheDocument();
    expect(screen.getByText('Ajustada com justificativa')).toBeInTheDocument();
    expect(screen.getByText('9,5')).toBeInTheDocument();
    expect(screen.getByText('8,5')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn();
    render(
      <EvaluationHistoryStudentCard
        student={unadjustedStudent}
        hideNames={false}
        onSelect={onSelect}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /ajustar autoavaliação de elisa nunes/i }),
    );

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(unadjustedStudent);
  });

  it('uses matricula in accessible button label when hideNames is true', async () => {
    const onSelect = vi.fn();
    render(
      <EvaluationHistoryStudentCard
        student={unadjustedStudent}
        hideNames={true}
        onSelect={onSelect}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /ajustar autoavaliação de 26121194/i }),
    );

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(unadjustedStudent);
  });
});
