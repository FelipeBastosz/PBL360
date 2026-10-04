import { Link } from 'react-router-dom';
import { DocumentTextIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '@/routes/paths';
import { INTERACTIVE_CARD_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

export function RoomTopActions({ isProfessor, roomId }: { isProfessor: boolean; roomId: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {isProfessor && (
        <button
          type="button"
          onClick={() => {}}
          className={cn(INTERACTIVE_CARD_CLASS, 'flex-row items-center gap-4 p-4 text-left')}
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-900">
            <DocumentTextIcon className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">Relatório Final</h3>
            <p className="text-xs text-muted">Notas de todos os problemas</p>
          </div>
        </button>
      )}

      <Link
        to={`${ROUTES.rooms}/${roomId}/participantes`}
        className={cn(INTERACTIVE_CARD_CLASS, 'flex-row items-center gap-4 p-4 text-left')}
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-900">
          <UserGroupIcon className="size-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-ink">Turma</h3>
          <p className="text-xs text-muted">Participantes da turma</p>
        </div>
      </Link>
    </div>
  );
}
