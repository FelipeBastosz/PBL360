import type { KeyboardEvent } from 'react';
import type { SessionColumn, StudentGradeRow, StudentSessionGrade } from '@/types/grades';
import type { StudentProblemFeedbackResponse } from '@/types/feedback';
import { formatSessionCell, resolveSessionName } from '@/utils/gradeFormatters';
import { StudentGradeInputField, type StudentGradeInputFieldProps } from './StudentGradeInputField';

export type EvaluationContext = {
  studentId: string;
  sessionId: string;
  sessionName: string;
  currentGrade: number | string | null;
  currentFeedback: string | null;
  updatedAt: string | null;
  existingFeedback?: StudentProblemFeedbackResponse | null;
};

export type StudentGradeFieldProps = {
  aluno?: StudentGradeRow;
  student?: StudentGradeRow;
  sessao?: SessionColumn;
  session?: SessionColumn;
  gradeItem?: StudentSessionGrade;
  existingFeedback?: StudentProblemFeedbackResponse | null;
  onSelectEvaluation?: (context: EvaluationContext) => void;
  onSelectStudent?: (student: StudentGradeRow) => void;
  onClick?: () => void;
  value?: string;
  onChange?: (val: string) => void;
  error?: string;
  disabled?: boolean;
  hideNames?: boolean;
};

function buildEvaluationContext(
  student: StudentGradeRow,
  session: SessionColumn,
  gradeItem?: StudentSessionGrade,
  feedback?: StudentProblemFeedbackResponse | null,
): EvaluationContext {
  const sessionName = resolveSessionName(session);
  const currentGrade = feedback?.nota ?? gradeItem?.nota ?? null;
  const currentFeedback = feedback?.texto ?? '';
  const updatedAt = feedback?.updatedAt ?? feedback?.editadoEm ?? feedback?.criadoEm ?? null;

  return {
    studentId: student.alunoId,
    sessionId: session.id,
    sessionName,
    currentGrade,
    currentFeedback,
    updatedAt,
    existingFeedback: feedback ?? null,
  };
}

function isGradeCellEditable(
  gradeItem?: StudentSessionGrade,
  feedback?: StudentProblemFeedbackResponse | null,
): boolean {
  if (gradeItem?.situacao === 'JUSTIFICADA') return false;
  const grade = feedback?.nota ?? gradeItem?.nota ?? null;
  return grade !== null && grade !== undefined && !Number.isNaN(Number(grade));
}

function resolveTargetStudentName(student?: StudentGradeRow, hideNames?: boolean): string {
  if (!student) return 'Aluno';
  return hideNames ? student.matricula || student.nome : student.nome;
}

export function StudentGradeField(props: StudentGradeFieldProps) {
  if (props.onChange && props.value !== undefined) {
    return (
      <StudentGradeInputField
        {...(props as unknown as StudentGradeInputFieldProps)}
        disabled={Boolean(props.disabled)}
      />
    );
  }

  const cellText = formatSessionCell(props.gradeItem?.nota, props.gradeItem?.situacao);
  if (!isGradeCellEditable(props.gradeItem, props.existingFeedback)) {
    return <td className="px-3 py-3.5 text-center text-muted">{cellText}</td>;
  }

  const student = props.aluno ?? props.student;
  const session = props.sessao ?? props.session;
  const sessionName = resolveSessionName(session);
  const studentName = resolveTargetStudentName(student, props.hideNames);

  const handleClick = () => {
    props.onClick?.();
    if (student && session) {
      props.onSelectEvaluation?.(
        buildEvaluationContext(student, session, props.gradeItem, props.existingFeedback),
      );
      props.onSelectStudent?.(student);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <td
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Avaliar ${studentName} na sessão ${sessionName}:${cellText}`}
      className="cursor-pointer hover:bg-gray-50 transition px-3 py-3.5 text-center text-muted group-hover:text-ink focus-visible:outline-none focus-visible:bg-gray-100"
    >
      {cellText}
    </td>
  );
}

export { StudentGradeField as StudentGradeCell };
