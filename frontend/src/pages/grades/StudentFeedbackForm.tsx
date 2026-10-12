import { Alert } from '@/components/ui/Alert';
import type { StudentGradeRow } from '@/types/grades';
import type { StudentProblemFeedbackResponse } from '@/types/feedback';
import { FeedbackFormActions } from './FeedbackFormActions';
import { StudentGradeField } from './StudentGradeField';
import { StudentCommentField } from './StudentCommentField';
import { useStudentFeedbackForm } from './hooks/useStudentFeedbackForm';

type StudentFeedbackFormProps = {
  student: StudentGradeRow;
  existingFeedback: StudentProblemFeedbackResponse | null;
  roomId: string;
  problemId: string;
  onSaved: (feedback: StudentProblemFeedbackResponse) => void;
  onClose: () => void;
};

export function StudentFeedbackForm(props: StudentFeedbackFormProps) {
  const form = useStudentFeedbackForm(props);

  return (
    <form noValidate onSubmit={form.handleSubmit} className="flex flex-col gap-4 py-2">
      {form.apiError && <Alert tone="error">{form.apiError}</Alert>}

      <StudentGradeField
        value={form.nota}
        onChange={(val) => {
          form.setNota(val);
          if (form.errors.nota) form.setErrors((prev) => ({ ...prev, nota: undefined }));
        }}
        error={form.errors.nota}
        disabled={form.isSubmitting}
      />

      <StudentCommentField
        value={form.texto}
        onChange={(val) => {
          form.setTexto(val);
          if (form.errors.texto) form.setErrors((prev) => ({ ...prev, texto: undefined }));
        }}
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
