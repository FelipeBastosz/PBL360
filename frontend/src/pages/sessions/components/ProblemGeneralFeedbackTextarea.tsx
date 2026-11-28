import { cn } from '@/utils/cn';
import { MAX_GENERAL_FEEDBACK_LENGTH } from '../hooks/useProblemGeneralFeedbackForm';

type ProblemGeneralFeedbackTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  disabled: boolean;
};

export function ProblemGeneralFeedbackTextarea({
  value,
  onChange,
  error,
  disabled,
}: ProblemGeneralFeedbackTextareaProps) {
  const errorId = 'problem-general-feedback-error';
  const counterId = 'problem-general-feedback-counter';
  const describedBy = error ? `${errorId} ${counterId}` : counterId;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="problem-general-feedback-text" className="text-sm font-semibold text-ink">
          Comentário Geral
        </label>
        <span id={counterId} aria-live="polite" className="text-xs text-muted">
          {value.length} / {MAX_GENERAL_FEEDBACK_LENGTH}
        </span>
      </div>

      <textarea
        id="problem-general-feedback-text"
        rows={5}
        value={value}
        maxLength={MAX_GENERAL_FEEDBACK_LENGTH}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Digite o parecer e considerações gerais sobre a turma neste problema..."
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded-xl border bg-elevated p-3 text-base text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)] transition-[border-color,box-shadow] duration-200 placeholder:text-placeholder focus:border-brand-accent focus:shadow-[0_0_0_4px_var(--color-brand-shadow)] focus:outline-none disabled:cursor-not-allowed disabled:bg-subtle',
          error ? 'border-danger' : 'border-border',
        )}
      />

      {error && (
        <p id={errorId} role="alert" className="animate-slide-down text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
