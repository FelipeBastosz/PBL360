import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Session } from '@/types/session';

type CardProps = {
  session: Session;
  onEdit: (s: Session) => void;
  onDelete: (s: Session) => void;
};

export function ManageSessionCard({ session, onEdit, onDelete }: CardProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 flex-col">
        <h3 className="font-bold break-words text-ink">{session.titulo}</h3>
        <p className="text-xs text-muted">{session.data}</p>
      </div>
      <div className="-mr-2 flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => onEdit(session)}
          aria-label={`Editar ${session.titulo}`}
          className="inline-flex size-11 items-center justify-center rounded-full transition-[background-color,scale] duration-200 active:scale-90 focus-visible:outline-2 text-ink/70 hover:bg-black/5 hover:text-brand-900 focus-visible:outline-brand-900"
        >
          <PencilIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(session)}
          aria-label={`Excluir ${session.titulo}`}
          className="inline-flex size-11 items-center justify-center rounded-full transition-[background-color,scale] duration-200 active:scale-90 focus-visible:outline-2 text-danger hover:bg-danger-soft focus-visible:outline-danger"
        >
          <TrashIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}
