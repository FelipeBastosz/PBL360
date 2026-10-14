import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import type { UserResponse } from '@/types/auth';
import type { Room } from '@/types/room';
import type { Problem } from '@/types/problem';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

function parseRoomTurma(fullName?: string) {
  if (!fullName) return '';
  const parts = fullName.split(' - ');
  return parts.length > 1 ? parts.pop() : '';
}

export function ProblemSessionsHeader({
  room,
  problem,
  userNome,
  user,
}: {
  room: Pick<Room, 'id' | 'nome'> | null;
  problem: Pick<Problem, 'titulo'> | null;
  userNome?: string;
  user?: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
}) {
  const turma = parseRoomTurma(room?.nome);

  return (
    <header className="shrink-0 bg-brand-900 text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <div className="flex items-center gap-3">
          <Link
            to={`/turmas/${room?.id}/problemas`}
            aria-label="Voltar para os problemas"
            className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-base font-semibold leading-tight">
              {problem?.titulo || 'Problema'}
            </h1>
            {turma && <span className="text-xs text-white/70">{turma}</span>}
          </div>
        </div>
        <UserMenuButton
          user={user ?? { id: '', nome: userNome ?? '', possuiFoto: false }}
          className="ring-2 ring-white/20"
        />
      </div>
    </header>
  );
}
