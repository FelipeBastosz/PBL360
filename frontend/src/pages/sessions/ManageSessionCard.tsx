import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Session } from '@/types/session';

type CardProps = {
  session: Session;
  onEdit: (s: Session) => void;
  onDelete: (s: Session) => void;
};

export function ManageSessionCard({ session, onEdit, onDelete }: CardProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex flex-col">
        <h3 className="font-bold text-ink">{session.titulo}</h3>
        <p className="text-xs text-muted">{session.data}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onEdit(session)}
          aria-label={`Editar ${session.titulo}`}
          className="p-1 text-ink/70 hover:text-brand-900 focus-visible:outline-2"
        >
          <PencilIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(session)}
          aria-label={`Excluir ${session.titulo}`}
          className="p-1 text-danger hover:text-danger/80 focus-visible:outline-2 focus-visible:outline-danger"
        >
          <TrashIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}
