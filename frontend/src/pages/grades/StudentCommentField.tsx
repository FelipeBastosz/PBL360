import { FeedbackTemplateSelector } from '@/pages/feedbacks/components/FeedbackTemplateSelector';
import {
  FEEDBACK_MAX_LENGTH,
  appendFeedbackTemplate,
  isFeedbackOverLimit,
} from '@/utils/feedbackTemplates';
import { cn } from '@/utils/cn';

type StudentCommentFieldProps = {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  disabled: boolean;
};

type StudentCommentFooterProps = {
  error?: string;
  isOverLimit: boolean;
  valueLength: number;
};

function StudentCommentFooter({ error, isOverLimit, valueLength }: StudentCommentFooterProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      {error ? (
        <p id="student-feedback-error" className="text-sm text-danger animate-slide-down">
          {error}
        </p>
      ) : isOverLimit ? (
        <p id="student-feedback-limit" className="text-xs font-medium text-danger">
          O feedback ultrapassa o limite de 2000 caracteres ({valueLength}/{FEEDBACK_MAX_LENGTH}).
          Reduza o texto antes de salvar.
        </p>
      ) : (
        <span />
      )}
      <span
        className={cn(
          'text-xs font-medium shrink-0',
          isOverLimit ? 'text-danger font-semibold' : 'text-muted',
        )}
      >
        {valueLength} / {FEEDBACK_MAX_LENGTH}
      </span>
    </div>
  );
}

export function StudentCommentField({
  value,
  onChange,
  error,
  disabled,
}: StudentCommentFieldProps) {
  const isOverLimit = isFeedbackOverLimit(value);

  const handleSelectTemplate = (templateText: string) => {
    onChange(appendFeedbackTemplate(value, templateText));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="student-feedback-text" className="text-sm font-semibold text-ink">
          Comentário de Feedback <span className="text-danger">*</span>
        </label>
        <FeedbackTemplateSelector onSelect={handleSelectTemplate} disabled={disabled} />
      </div>

      <textarea
        id="student-feedback-text"
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Digite o feedback detalhado do aluno..."
        disabled={disabled}
        aria-invalid={Boolean(error || isOverLimit)}
        aria-describedby={
          error ? 'student-feedback-error' : isOverLimit ? 'student-feedback-limit' : undefined
        }
        className={cn(
          'w-full rounded-xl border p-3 text-base text-ink bg-white shadow-[0_1px_2px_rgb(16_33_76/0.06)] transition-[border-color,box-shadow] duration-200 focus:outline-none placeholder:text-placeholder focus:border-brand-900 focus:shadow-[0_0_0_4px_rgb(0_0_119/0.12)] disabled:bg-black/5 disabled:cursor-not-allowed',
          error || isOverLimit ? 'border-danger' : 'border-black/10',
        )}
      />

      <StudentCommentFooter error={error} isOverLimit={isOverLimit} valueLength={value.length} />
    </div>
  );
}
