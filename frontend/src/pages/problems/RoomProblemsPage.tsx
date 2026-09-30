import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeftIcon,
  DocumentTextIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import { problemService } from '@/services/problem.service';
import { ROUTES } from '@/routes/paths';
import type { Room } from '@/types/room';
import { cn } from '@/utils/cn';
import { ProblemsEmptyState } from './ProblemsEmptyState';

function getInitials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function parseRoomName(fullName?: string) {
  if (!fullName) return { disciplina: 'Turma', turma: '' };
  const parts = fullName.split(' - ');
  if (parts.length > 1) {
    const turma = parts.pop() || '';
    return { disciplina: parts.join(' - '), turma };
  }
  return { disciplina: fullName, turma: '' };
}

function RoomProblemsHeader({ room, userNome }: { room: Room | null; userNome?: string }) {
  const { disciplina, turma } = parseRoomName(room?.nome);

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
      <div className="flex size-9 items-center justify-center rounded-full bg-brand-200 text-sm font-semibold text-brand-900">
        {getInitials(userNome)}
      </div>
    </header>
  );
}

function RoomTopActions({ isProfessor, roomId }: { isProfessor: boolean; roomId: string }) {
  return (
    <div className="flex flex-col gap-3">
      {isProfessor && (
        <button
          type="button"
          onClick={() => {}}
          className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:shadow-md text-left"
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
        className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:shadow-md text-left"
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

function ProblemsSearch({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  return (
    <div className="relative mt-2">
      <input
        type="text"
        placeholder="Pesquisar problema"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-12 w-full rounded-[10px] border border-black/10 bg-white pl-10 pr-4 text-ink placeholder:text-placeholder focus:border-brand-900 focus:outline-none"
      />
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-placeholder" />
    </div>
  );
}

function ProblemsFabMenu({ isProfessor }: { isProfessor: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!isProfessor) return null;

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex animate-fade-up flex-col items-end gap-2">
          <button className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50">
            Editar um problema
          </button>
          <button className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50">
            Criar novo problema
          </button>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex size-14 items-center justify-center rounded-full bg-brand-900 text-white shadow-lg transition-transform',
          isOpen ? 'rotate-45 bg-danger' : '',
        )}
        aria-label="Ações de problema"
      >
        <PlusIcon className="size-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default function RoomProblemsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [problems, setProblems] = useState<unknown[]>([]);
  const [query, setQuery] = useState('');

  const isProfessor = user?.tipo === 'PROFESSOR';
  const {
    run: fetchRoom,
    isLoading: isLoadingRoom,
    error: roomError,
  } = useAsyncAction(roomService.getById);
  const { run: fetchProblems, isLoading: isLoadingProblems } = useAsyncAction(problemService.list);

  useEffect(() => {
    if (id) {
      fetchRoom(id).then((res) => {
        if (res.ok) setRoom(res.data);
      });
      fetchProblems(id).then((res) => {
        if (res.ok) setProblems(res.data);
      });
    }
  }, [id, fetchRoom, fetchProblems]);

  const isLoading = isLoadingRoom || isLoadingProblems;

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <RoomProblemsHeader room={room} userNome={user?.nome} />
      <main className="mx-auto mt-6 flex w-full max-w-md flex-col gap-4 px-4">
        {roomError && <Alert tone="error">{roomError.message}</Alert>}
        <RoomTopActions isProfessor={isProfessor} roomId={id ?? ''} />
        <ProblemsSearch query={query} setQuery={setQuery} />
        {isLoading ? (
          <div className="mt-10 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        ) : problems.length === 0 ? (
          <ProblemsEmptyState isProfessor={isProfessor} />
        ) : (
          <div className="mt-2 flex flex-col gap-3">{/* Lista de problemas futura */}</div>
        )}
      </main>
      <ProblemsFabMenu isProfessor={isProfessor} />
    </div>
  );
}
