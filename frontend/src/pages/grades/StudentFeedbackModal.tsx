import { Sheet } from '@/components/ui/Sheet';
import type { StudentGradeRow } from '@/types/grades';
import type { StudentProblemFeedbackResponse } from '@/types/feedback';
import { StudentFeedbackForm } from './StudentFeedbackForm';
import type { EvaluationContext } from './StudentGradeField';

export type StudentFeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  student: StudentGradeRow | null;
  existingFeedback: StudentProblemFeedbackResponse | null;
  hideNames: boolean;
  roomId: string;
  problemId: string;
  onSaved: (feedback: StudentProblemFeedbackResponse) => void;
  evaluation?: EvaluationContext | null;
  sessionName?: string;
  currentGrade?: number | string | null;
  currentFeedback?: string | null;
  updatedAt?: string | null;
};

function getModalHeaderInfo(
  student: StudentGradeRow | null,
  evaluation?: EvaluationContext | null,
  sessionName?: string,
  hideNames?: boolean,
) {
  const effectiveSessionName = evaluation?.sessionName ?? sessionName;
  const modalTitle = effectiveSessionName
    ? `Feedback - ${effectiveSessionName}`
    : hideNames
      ? student?.matricula || 'Sem matrícula'
      : student?.nome || 'Feedback';

  const modalDescription = hideNames
    ? 'Feedback individual'
    : student?.matricula
      ? `Matrícula: ${student.matricula}`
      : 'Feedback individual';

  return { modalTitle, modalDescription };
}

function resolveTargetStudent(
  student: StudentGradeRow | null,
  evaluation?: EvaluationContext | null,
): StudentGradeRow {
  return (
    student ?? {
      alunoId: evaluation?.studentId ?? '',
      nome: '',
      matricula: null,
      sessoes: [],
      notaFinal: null,
    }
  );
}

export function StudentFeedbackModal(props: StudentFeedbackModalProps) {
  const { isOpen, onClose, student, existingFeedback, hideNames, evaluation } = props;
  if (!student && !evaluation) return null;

  const { modalTitle, modalDescription } = getModalHeaderInfo(
    student,
    evaluation,
    props.sessionName,
    hideNames,
  );
  const targetStudent = resolveTargetStudent(student, evaluation);

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      title={modalTitle}
      description={modalDescription}
    >
      {isOpen && (
        <StudentFeedbackForm
          key={`${targetStudent.alunoId}-${evaluation?.sessionId ?? 'sess'}-${existingFeedback?.id ?? 'new'}`}
          student={targetStudent}
          existingFeedback={existingFeedback}
          roomId={props.roomId}
          problemId={props.problemId}
          onSaved={props.onSaved}
          onClose={onClose}
          currentGrade={evaluation?.currentGrade ?? props.currentGrade}
          currentFeedback={evaluation?.currentFeedback ?? props.currentFeedback}
          updatedAt={evaluation?.updatedAt ?? props.updatedAt}
        />
      )}
    </Sheet>
  );
}
