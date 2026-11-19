import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { SessionGeneralEvaluation } from '@/types/session';
import { formatDateTime } from '@/utils/date';

type SessionGeneralEvaluationItemProps = {
  evaluation: SessionGeneralEvaluation;
  isAuthor: boolean;
  canEdit: boolean;
  onEdit: () => void;
};

function ItemDates({ criadoEm, editadoEm }: { criadoEm: string; editadoEm: string | null }) {
  const isEdited = Boolean(editadoEm && editadoEm !== criadoEm);

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
      <time dateTime={criadoEm}>Criado em {formatDateTime(criadoEm)}</time>
      {isEdited && (
        <>
          <span>•</span>
          <time dateTime={editadoEm!}>Editado em {formatDateTime(editadoEm!)}</time>
        </>
      )}
    </div>
  );
}

export function SessionGeneralEvaluationItem({
  evaluation,
  isAuthor,
  canEdit,
  onEdit,
}: SessionGeneralEvaluationItemProps) {
  return (
    <article className="flex flex-col gap-2.5 rounded-xl border border-black/5 bg-surface/40 p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <UserAvatar
            user={{ id: evaluation.autor.id, nome: evaluation.autor.nome, possuiFoto: false }}
            className="size-8 text-xs"
          />
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-semibold text-ink">
              {evaluation.autor.nome}
              {isAuthor && <span className="ml-1 text-xs font-normal text-muted">(você)</span>}
            </span>
            <ItemDates criadoEm={evaluation.criadoEm} editadoEm={evaluation.editadoEm} />
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 rounded-lg p-1.5 text-xs font-medium text-brand-900 transition hover:bg-black/5"
            aria-label="Editar avaliação geral"
          >
            <PencilSquareIcon className="size-4" />
            <span className="hidden sm:inline">Editar</span>
          </button>
        )}
      </header>

      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink/90">
        {evaluation.texto}
      </p>
    </article>
  );
}
