import { UserAvatar } from '@/components/ui/UserAvatar';
import { formatDayShortMonth, formatDate } from '@/utils/date';
import { formatGrade } from '@/utils/formatGrade';
import type { FeedbackAuthor } from '@/types/feedback';
import type { ReceivedSessionComponents } from '@/types/feedback';
import { EvaluationComponentGrades } from './EvaluationComponentGrades';
import { FeedbackBadge } from './FeedbackBadge';

export type FeedbackCardProps = {
  autor: FeedbackAuthor;
  texto: string | null;
  criadoEm: string;
  editadoEm?: string | null;
  novo?: boolean;
  nota?: number | null;
  tag?: string;
  avaliacoes?: ReceivedSessionComponents;
  emptyTextMessage?: string;
};

type FeedbackCardHeaderProps = {
  autor: FeedbackAuthor;
  criadoEm: string;
  tag?: string;
  nota?: number | null;
  novo?: boolean;
};

function FeedbackCardHeader({ autor, criadoEm, tag, nota, novo }: FeedbackCardHeaderProps) {
  const displayDate = formatDayShortMonth(criadoEm);
  const formattedFullDate = formatDate(criadoEm);

  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <UserAvatar user={{ id: autor.id, nome: autor.nome, possuiFoto: false }} />
        <div className="flex flex-col min-w-0">
          <span className="truncate text-sm font-semibold text-ink">{autor.nome}</span>
          <time dateTime={criadoEm} title={formattedFullDate} className="text-xs text-muted">
            {displayDate}
          </time>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {tag && (
          <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted">
            {tag}
          </span>
        )}
        {typeof nota === 'number' && Number.isFinite(nota) && (
          <span
            data-testid="feedback-nota"
            className="rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-accent border border-brand-border"
          >
            Nota {formatGrade(nota)}
          </span>
        )}
        <FeedbackBadge isNew={novo} />
      </div>
    </header>
  );
}

export function FeedbackCard({
  autor,
  texto,
  criadoEm,
  editadoEm,
  novo,
  nota,
  tag,
  avaliacoes,
  emptyTextMessage,
}: FeedbackCardProps) {
  const hasText = Boolean(texto?.trim());

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-elevated p-5 shadow-sm">
      <FeedbackCardHeader autor={autor} criadoEm={criadoEm} tag={tag} nota={nota} novo={novo} />

      <EvaluationComponentGrades avaliacoes={avaliacoes} />

      {hasText ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink/90">{texto}</p>
      ) : (
        <p className="text-sm italic text-muted">
          {emptyTextMessage ?? 'Nenhum feedback textual registrado.'}
        </p>
      )}

      {editadoEm && (
        <footer className="text-right text-[11px] text-muted/80">
          editado em {formatDate(editadoEm)}
        </footer>
      )}
    </article>
  );
}
