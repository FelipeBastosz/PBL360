import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import type { Room } from '@/types/room';
import type { Problem } from '@/types/problem';

function getInitials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function parseRoomTurma(fullName?: string) {
  if (!fullName) return '';
  const parts = fullName.split(' - ');
  return parts.length > 1 ? parts.pop() : '';
}

export function ProblemSessionsHeader({
  room,
  problem,
  userNome,
}: {
  room: Room | null;
  problem: Problem | null;
  userNome?: string;
}) {
  const turma = parseRoomTurma(room?.nome);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4 text-white">
      <div className="flex items-center gap-3">
        <Link
          to={`/turmas/${room?.id}/problemas`}
          aria-label="Voltar para os problemas"
          className="rounded-md p-1 hover:bg-white/10"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-base font-semibold leading-tight">{problem?.titulo || 'Problema'}</h1>
          {turma && <span className="text-xs text-white/70">{turma}</span>}
        </div>
      </div>
      <div className="flex size-9 items-center justify-center rounded-full bg-brand-200 text-sm font-semibold text-brand-900">
        {getInitials(userNome)}
      </div>
    </header>
  );
}
