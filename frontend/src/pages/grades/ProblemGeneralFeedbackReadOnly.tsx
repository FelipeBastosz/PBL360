import type { GeneralFeedbackResponse } from '@/types/feedback';
import { formatLastEdited } from '@/utils/gradeFormatters';

type ProblemGeneralFeedbackReadOnlyProps = {
  feedback: GeneralFeedbackResponse;
};

export function ProblemGeneralFeedbackReadOnly({ feedback }: ProblemGeneralFeedbackReadOnlyProps) {
  const lastEditedText = formatLastEdited(
    feedback.updatedAt ?? feedback.editadoEm ?? feedback.criadoEm,
  );

  return (
    <section
      aria-labelledby="problem-grades-general-feedback-heading"
      className="flex flex-col gap-2 rounded-3xl border border-border-subtle bg-elevated p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="problem-grades-general-feedback-heading"
          className="text-sm font-semibold tracking-wider text-brand-accent uppercase"
        >
          Feedback Geral da Turma
        </h2>
        {lastEditedText && (
          <span className="text-xs text-muted">Última edição: {lastEditedText}</span>
        )}
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{feedback.texto}</p>
    </section>
  );
}
