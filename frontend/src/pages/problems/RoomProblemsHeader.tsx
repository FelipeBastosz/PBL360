import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ROUTES } from '@/routes/paths';
import type { UserResponse } from '@/types/auth';
import type { Room } from '@/types/room';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

type RoomProblemsHeaderProps = {
  room: Pick<Room, 'nome'> | null;
  user: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
  backTo?: string;
  backLabel?: string;
};

function parseRoomName(fullName?: string) {
  if (!fullName) return { disciplina: 'Turma', turma: '' };
  const parts = fullName.split(' - ');
  if (parts.length > 1) {
    const turma = parts.pop() || '';
    return { disciplina: parts.join(' - '), turma };
  }
  return { disciplina: fullName, turma: '' };
}

export function RoomProblemsHeader({
  room,
  user,
  backTo = ROUTES.rooms,
  backLabel = 'Voltar para as turmas',
}: RoomProblemsHeaderProps) {
  const { disciplina, turma } = parseRoomName(room?.nome);

  return (
    <header className="sticky top-0 z-10 bg-brand-900 text-white shadow-[0_6px_18px_-12px_rgb(0_0_119/0.8)]">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center gap-3')}>
        <Link
          to={backTo}
          aria-label={backLabel}
          className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ChevronLeftIcon className="size-6" aria-hidden />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col animate-slide-down">
          <h1 className="truncate text-xl leading-tight font-semibold">{disciplina}</h1>
          {turma && <span className="truncate text-sm text-white/70">{turma}</span>}
        </div>
        <UserAvatar user={user} className="animate-pop-in ring-2 ring-white/20" />
      </div>
    </header>
  );
}
