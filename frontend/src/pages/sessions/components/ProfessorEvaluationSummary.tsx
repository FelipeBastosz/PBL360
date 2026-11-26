import { PencilIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { SessionGeneralEvaluation } from '@/types/session';
import { ItemDates } from './SessionGeneralEvaluationItem';

export type ProfessorEvaluationSummaryProps = {
  evaluation: SessionGeneralEvaluation;
  isAuthor: boolean;
  canEdit: boolean;
  onOpenModal: () => void;
};

export function ProfessorEvaluationSummary({
  evaluation,
  isAuthor,
  canEdit,
  onOpenModal,
}: ProfessorEvaluationSummaryProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border-subtle bg-surface/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <UserAvatar
            user={{ id: evaluation.autor.id, nome: evaluation.autor.nome, possuiFoto: false }}
            className="size-8 shrink-0 text-xs"
          />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="truncate text-sm font-semibold text-ink">
              {evaluation.autor.nome}
              {isAuthor && <span className="ml-1 text-xs font-normal text-muted">(você)</span>}
            </span>
            <ItemDates criadoEm={evaluation.criadoEm} editadoEm={evaluation.editadoEm} />
          </div>
        </div>

        {canEdit && (
          <div className="-mr-1 flex shrink-0 items-center">
            <button
              type="button"
              onClick={onOpenModal}
              className="inline-flex size-9 items-center justify-center rounded-full text-ink/70 transition-[background-color,scale] duration-200 hover:bg-subtle hover:text-brand-accent active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-accent"
              aria-label="Editar feedback geral"
            >
              <PencilIcon className="size-5" />
            </button>
          </div>
        )}
      </div>

      <p
        className={`line-clamp-2 text-xs text-ink/80 ${canEdit ? 'cursor-pointer' : ''}`}
        onClick={canEdit ? onOpenModal : undefined}
      >
        {evaluation.texto}
      </p>
    </div>
  );
}
