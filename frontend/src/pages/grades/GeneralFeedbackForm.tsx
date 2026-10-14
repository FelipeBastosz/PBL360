import { Alert } from '@/components/ui/Alert';
import type { GeneralFeedbackResponse } from '@/types/feedback';
import { FeedbackFormActions } from './FeedbackFormActions';
import { GeneralFeedbackTextarea } from './GeneralFeedbackTextarea';
import { useGeneralFeedbackForm } from './hooks/useGeneralFeedbackForm';

export type GeneralFeedbackFormProps = {
  existingFeedback: GeneralFeedbackResponse | null;
  roomId: string;
  problemId: string;
  onSaved: (feedback: GeneralFeedbackResponse) => void;
  onClose: () => void;
  updatedAt?: string | null;
};

export function GeneralFeedbackForm(props: GeneralFeedbackFormProps) {
  const form = useGeneralFeedbackForm(props);

  return (
    <form noValidate onSubmit={form.handleSubmit} className="flex flex-col gap-4 py-2">
      {form.apiError && <Alert tone="error">{form.apiError}</Alert>}

      <GeneralFeedbackTextarea
        value={form.texto}
        onChange={(val) => {
          form.setTexto(val);
          if (form.error) form.setError(null);
        }}
        error={form.error}
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
