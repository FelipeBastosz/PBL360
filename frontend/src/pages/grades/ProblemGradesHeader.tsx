import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import type { Room } from '@/types/room';
import type { Problem } from '@/types/problem';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

function parseRoomTurma(fullName?: string) {
  if (!fullName) return '';
  const parts = fullName.split(' - ');
  return parts.length > 1 ? parts.pop() : '';
}

export type ProblemGradesHeaderProps = {
  room: Pick<Room, 'id' | 'nome'> | null;
  problem: Pick<Problem, 'id' | 'titulo'> | null;
  backTo?: string;
};

export function ProblemGradesHeader({ room, problem, backTo }: ProblemGradesHeaderProps) {
  const { user } = useAuth();
  const turma = parseRoomTurma(room?.nome);
  const defaultBack =
    room?.id && problem?.id
      ? `/turmas/${room.id}/problemas/${problem.id}`
      : room?.id
        ? `/turmas/${room.id}/problemas`
        : '/turmas';

  return (
    <header className="sticky top-0 z-30 bg-brand-900 text-white shadow-[0_6px_18px_-12px_rgb(0_0_119/0.8)]">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <div className="flex items-center gap-3">
          <Link
            to={backTo || defaultBack}
            aria-label="Voltar para o problema"
            className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" aria-hidden />
          </Link>
          <div className="flex flex-col animate-slide-down">
            <h1 className="text-base font-semibold leading-tight sm:text-lg">
              {problem?.titulo || 'Relatório Final'}
            </h1>
            {turma && <span className="text-xs text-white/70">{turma}</span>}
          </div>
        </div>
        <UserMenuButton user={user} className="animate-pop-in ring-2 ring-white/20" />
      </div>
    </header>
  );
}
