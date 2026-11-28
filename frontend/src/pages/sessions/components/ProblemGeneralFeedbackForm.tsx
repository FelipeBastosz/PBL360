import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import type { GeneralFeedbackResponse } from '@/types/feedback';
import { useProblemGeneralFeedbackForm } from '../hooks/useProblemGeneralFeedbackForm';
import { ProblemGeneralFeedbackTextarea } from './ProblemGeneralFeedbackTextarea';

export type ProblemGeneralFeedbackFormProps = {
  existingFeedback: GeneralFeedbackResponse | null;
  roomId: string;
  problemId: string;
  onSaved: (feedback: GeneralFeedbackResponse | null) => void;
  onClose: () => void;
};

type FormFooterProps = {
  lastEditedText: string | null;
  isSubmitting: boolean;
  onCancel: () => void;
};

function FormFooter({ lastEditedText, isSubmitting, onCancel }: FormFooterProps) {
  return (
    <div className="mt-2 flex flex-col gap-3 pt-2">
      {lastEditedText && <p className="text-sm text-muted">Última edição: {lastEditedText}</p>}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
          className="h-11 w-auto px-5 text-sm"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="h-11 w-auto px-6 text-sm"
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}

export function ProblemGeneralFeedbackForm(props: ProblemGeneralFeedbackFormProps) {
  const form = useProblemGeneralFeedbackForm(props);

  return (
    <form noValidate onSubmit={form.handleSubmit} className="flex flex-col gap-4 py-2">
      {form.apiError && <Alert tone="error">{form.apiError}</Alert>}

      <ProblemGeneralFeedbackTextarea
        value={form.texto}
        onChange={(value) => {
          form.setTexto(value);
          if (form.error) form.setError(null);
        }}
        error={form.error}
        disabled={form.isSubmitting}
      />

      <FormFooter
        lastEditedText={form.lastEditedText}
        isSubmitting={form.isSubmitting}
        onCancel={props.onClose}
      />
    </form>
  );
}
