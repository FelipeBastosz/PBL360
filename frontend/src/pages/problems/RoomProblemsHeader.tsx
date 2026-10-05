import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ROUTES } from '@/routes/paths';
import type { UserResponse } from '@/types/auth';

function parseRoomName(fullName?: string) {
  if (!fullName) return { disciplina: 'Turma', turma: '' };
  const parts = fullName.split(' - ');
  if (parts.length > 1) {
    const turma = parts.pop() || '';
    return { disciplina: parts.join(' - '), turma };
  }
  return { disciplina: fullName, turma: '' };
}

type RoomProblemsHeaderProps = {
  roomName?: string;
  user: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
};

export function RoomProblemsHeader({ roomName, user }: RoomProblemsHeaderProps) {
  const { disciplina, turma } = parseRoomName(roomName);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4 text-white">
      <div className="flex items-center gap-3">
        <Link
          to={ROUTES.rooms}
          aria-label="Voltar para as turmas"
          className="rounded-md p-1 hover:bg-white/10"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-base font-semibold leading-tight">{disciplina}</h1>
          {turma && <span className="text-xs text-white/70">{turma}</span>}
        </div>
      </div>
      <UserAvatar user={user} />
    </header>
  );
}
