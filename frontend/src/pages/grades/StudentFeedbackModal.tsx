import { Sheet } from '@/components/ui/Sheet';
import type { StudentGradeRow } from '@/types/grades';
import type { StudentProblemFeedbackResponse } from '@/types/feedback';
import { StudentFeedbackForm } from './StudentFeedbackForm';

export type StudentFeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  student: StudentGradeRow | null;
  existingFeedback: StudentProblemFeedbackResponse | null;
  hideNames: boolean;
  roomId: string;
  problemId: string;
  onSaved: (feedback: StudentProblemFeedbackResponse) => void;
};

export function StudentFeedbackModal({
  isOpen,
  onClose,
  student,
  existingFeedback,
  hideNames,
  roomId,
  problemId,
  onSaved,
}: StudentFeedbackModalProps) {
  if (!student) return null;

  const modalTitle = hideNames ? student.matricula || 'Sem matrícula' : student.nome;
  const modalDescription = hideNames
    ? 'Feedback individual'
    : student.matricula
      ? `Matrícula: ${student.matricula}`
      : 'Feedback individual';

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
          key={`${student.alunoId}-${existingFeedback?.id ?? 'new'}`}
          student={student}
          existingFeedback={existingFeedback}
          roomId={roomId}
          problemId={problemId}
          onSaved={onSaved}
          onClose={onClose}
        />
      )}
    </Sheet>
  );
}
