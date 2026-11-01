import { UserAvatar } from '@/components/ui/UserAvatar';
import { formatDayShortMonth, formatFullDate } from '@/utils/formatDate';
import type { FeedbackAuthor } from '@/types/feedback';
import { FeedbackBadge } from './FeedbackBadge';

export type FeedbackCardProps = {
  autor: FeedbackAuthor;
  texto: string;
  criadoEm: string;
  editadoEm?: string | null;
  novo?: boolean;
  nota?: number | null;
  tag?: string;
};

export function FeedbackCard({
  autor,
  texto,
  criadoEm,
  editadoEm,
  novo,
  nota,
  tag,
}: FeedbackCardProps) {
  const displayDate = formatDayShortMonth(criadoEm.split('T')[0] ?? criadoEm);
  const formattedFullDate = formatFullDate(criadoEm);

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
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
              className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-900 border border-brand-200"
            >
              Nota {nota.toFixed(1)}
            </span>
          )}
          <FeedbackBadge isNew={novo} />
        </div>
      </header>

      <p className="whitespace-pre-line text-sm leading-relaxed text-ink/90">{texto}</p>

      {editadoEm && (
        <footer className="text-right text-[11px] text-muted/80">
          editado em {formatFullDate(editadoEm)}
        </footer>
      )}
    </article>
  );
}
