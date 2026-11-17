import { FeedbackTemplateSelector } from '@/pages/feedbacks/components/FeedbackTemplateSelector';
import {
  FEEDBACK_MAX_LENGTH,
  appendFeedbackTemplate,
  isFeedbackOverLimit,
} from '@/utils/feedbackTemplates';
import { cn } from '@/utils/cn';

type Props = {
  feedback: string;
  onChange: (val: string) => void;
  disabled?: boolean;
};

export function EvaluationFeedbackCard({ feedback, onChange, disabled = false }: Props) {
  const isOverLimit = isFeedbackOverLimit(feedback);

  const handleSelectTemplate = (templateText: string) => {
    onChange(appendFeedbackTemplate(feedback, templateText));
  };

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-brand-900">Feedback</h2>
        <FeedbackTemplateSelector onSelect={handleSelectTemplate} disabled={disabled} />
      </div>

      <textarea
        rows={4}
        placeholder="Escreva aqui um feedback para o(a) aluno(a)..."
        value={feedback}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={isOverLimit}
        aria-describedby={isOverLimit ? 'feedback-limit-warning' : undefined}
        className={cn(
          'mt-3 w-full resize-none rounded-2xl border bg-brand-50/40 p-4 text-sm text-ink placeholder:text-muted transition focus:bg-white focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-black/5',
          isOverLimit
            ? 'border-danger focus:border-danger focus:ring-danger'
            : 'border-brand-100/80 focus:border-brand-900 focus:ring-brand-900',
        )}
      />

      <div className="mt-1 flex items-center justify-between gap-2">
        {isOverLimit ? (
          <p id="feedback-limit-warning" className="text-xs font-medium text-danger">
            O feedback ultrapassa o limite de 2000 caracteres ({feedback.length}/
            {FEEDBACK_MAX_LENGTH}). Reduza o texto antes de salvar.
          </p>
        ) : (
          <span />
        )}
        <span
          className={cn(
            'text-xs font-medium',
            isOverLimit ? 'text-danger font-semibold' : 'text-muted',
          )}
        >
          {feedback.length}/{FEEDBACK_MAX_LENGTH}
        </span>
      </div>
    </div>
  );
}
