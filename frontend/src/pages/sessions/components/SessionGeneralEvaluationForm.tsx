import { Alert } from '@/components/ui/Alert';
import type { SessionGeneralEvaluation } from '@/types/session';
import { SessionGeneralEvaluationFormActions } from './SessionGeneralEvaluationFormActions';
import { SessionGeneralEvaluationTextarea } from './SessionGeneralEvaluationTextarea';
import { useSessionGeneralEvaluationForm } from './hooks/useSessionGeneralEvaluationForm';

export type SessionGeneralEvaluationFormProps = {
  sessionId: string;
  existingEvaluation: SessionGeneralEvaluation | null;
  onSaved: (saved: SessionGeneralEvaluation | null) => void;
  onClose: () => void;
};

export function SessionGeneralEvaluationForm(props: SessionGeneralEvaluationFormProps) {
  const form = useSessionGeneralEvaluationForm(props);

  return (
    <form noValidate onSubmit={form.handleSubmit} className="flex flex-col gap-4 py-2">
      {form.apiError && <Alert tone="error">{form.apiError}</Alert>}

      <SessionGeneralEvaluationTextarea
        value={form.texto}
        onChange={(val) => {
          form.setTexto(val);
          if (form.error) form.setError(null);
        }}
        error={form.error}
        disabled={form.isSubmitting}
      />

      <SessionGeneralEvaluationFormActions
        lastEditedText={form.lastEditedText}
        isSubmitting={form.isSubmitting}
        onCancel={props.onClose}
      />
    </form>
  );
}
