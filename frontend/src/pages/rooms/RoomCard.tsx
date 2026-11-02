import { Link } from 'react-router-dom';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import { CARD_ACCENT_CLASS, INTERACTIVE_CARD_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/routes/paths';
import { countLabel } from '@/utils/countLabel';
import type { Room } from '@/types/room';

export type RoomCardProps = {
  room: Room;
  professorNome?: string;
  isLeaveMode?: boolean;
  isOwner?: boolean;
  onLeaveRequest?: (room: Room) => void;
};

export function RoomCard({
  room,
  professorNome,
  isLeaveMode = false,
  isOwner = false,
  onLeaveRequest,
}: RoomCardProps) {
  return (
    <div className={cn(INTERACTIVE_CARD_CLASS, 'group flex flex-col justify-between')}>
      <div className={CARD_ACCENT_CLASS} />
      <div className="flex flex-col gap-3 p-4">
        <Link to={`${ROUTES.rooms}/${room.id}/problemas`} className="focus-visible:outline-none">
          <h3 className="line-clamp-2 text-base font-bold text-brand-900 group-hover:text-brand-900">
            {room.nome}
          </h3>
          {professorNome && <p className="text-sm text-muted">Prof. {professorNome}</p>}
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm text-muted">
            {countLabel(room.totalAlunos ?? 0, 'aluno', 'alunos')}
          </span>
          <span className="rounded-full bg-brand-200 px-2.5 py-0.5 text-xs font-bold text-brand-900">
            {countLabel(room.totalProblemas ?? 0, 'problema', 'problemas')}
          </span>
        </div>
        {isLeaveMode && onLeaveRequest && (
          <div className="mt-1 flex items-center justify-between border-t border-black/5 pt-2">
            {isOwner ? (
              <span className="rounded-full bg-amber-100/70 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                Professor responsável
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => onLeaveRequest(room)}
              aria-label={`Sair da turma ${room.nome}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:text-danger/80 focus-visible:outline-2 focus-visible:outline-danger"
            >
              <ArrowRightStartOnRectangleIcon className="size-4" aria-hidden="true" />
              Sair da turma
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
