import { Alert } from '@/components/ui/Alert';
import type { StudentGradeRow } from '@/types/grades';
import type { StudentProblemFeedbackResponse } from '@/types/feedback';
import { FeedbackFormActions } from './FeedbackFormActions';
import { StudentGradeInputField } from './StudentGradeInputField';
import { StudentCommentField } from './StudentCommentField';
import { StudentGradeAdjustmentFields } from './StudentGradeAdjustmentFields';
import { useStudentFeedbackForm } from './hooks/useStudentFeedbackForm';

export type StudentFeedbackFormProps = {
  student: StudentGradeRow;
  existingFeedback: StudentProblemFeedbackResponse | null;
  roomId: string;
  problemId: string;
  onSaved: (feedback: StudentProblemFeedbackResponse) => void;
  onClose: () => void;
  currentGrade?: number | string | null;
  currentFeedback?: string | null;
  updatedAt?: string | null;
};

export function StudentFeedbackForm(props: StudentFeedbackFormProps) {
  const form = useStudentFeedbackForm(props);

  return (
    <form noValidate onSubmit={form.handleSubmit} className="flex flex-col gap-4 py-2">
      {form.apiError && <Alert tone="error">{form.apiError}</Alert>}

      {form.isEditingExistingGrade && form.existingGrade !== null ? (
        <StudentGradeAdjustmentFields
          existingGrade={form.existingGrade}
          newGrade={form.nota}
          onNewGradeChange={form.handleNotaChange}
          justification={form.justificativa}
          onJustificationChange={form.handleJustificativaChange}
          gradeError={form.errors.nota}
          justificationError={form.errors.justificativa}
          disabled={form.isSubmitting}
        />
      ) : (
        <StudentGradeInputField
          value={form.nota}
          onChange={form.handleNotaChange}
          error={form.errors.nota}
          disabled={form.isSubmitting}
        />
      )}

      <StudentCommentField
        value={form.texto}
        onChange={form.handleTextoChange}
        error={form.errors.texto}
        disabled={form.isSubmitting}
      />

      <FeedbackFormActions
        lastEditedText={form.lastEditedText}
        isSubmitting={form.isSubmitting}
        onCancel={props.onClose}
      />
    </form>
  );
}
