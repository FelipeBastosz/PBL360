import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import { problemService } from '@/services/problem.service';
import type { Room } from '@/types/room';
import type { Problem } from '@/types/problem';
import { cn } from '@/utils/cn';
import { ProblemsEmptyState } from './ProblemsEmptyState';
import { ProblemFormModal } from './ProblemFormModal';
import { ProblemCard } from './ProblemCard';
import { RoomProblemsHeader } from './RoomProblemsHeader';
import { RoomTopActions } from './RoomTopActions';

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

function ProblemsFabMenu({
  isProfessor,
  onOpenCreate,
}: {
  isProfessor: boolean;
  onOpenCreate: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  if (!isProfessor) return null;

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex animate-fade-up flex-col items-end gap-2">
          <button className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50">
            Editar um problema
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenCreate();
            }}
            className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
          >
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

type MainProps = {
  roomError: { message: string } | null;
  isProfessor: boolean;
  roomId: string;
  query: string;
  setQuery: (q: string) => void;
  isLoading: boolean;
  problems: Problem[];
};

function RoomProblemsMain({
  roomError,
  isProfessor,
  roomId,
  query,
  setQuery,
  isLoading,
  problems,
}: MainProps) {
  return (
    <main className="mx-auto mt-6 flex w-full max-w-md flex-col gap-4 px-4">
      {roomError && <Alert tone="error">{roomError.message}</Alert>}
      <RoomTopActions isProfessor={isProfessor} roomId={roomId} />
      <ProblemsSearch query={query} setQuery={setQuery} />
      {isLoading ? (
        <div className="mt-10 flex justify-center">
          <Spinner className="size-8 text-brand-900" />
        </div>
      ) : problems.length === 0 ? (
        query ? (
          <p className="mt-10 text-center text-sm text-muted">Nenhum problema encontrado.</p>
        ) : (
          <ProblemsEmptyState isProfessor={isProfessor} />
        )
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          {problems.map((p) => (
            <ProblemCard key={p.id} problem={p} roomId={roomId} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function RoomProblemsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { notify } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [query, setQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isProfessor = user?.tipo === 'PROFESSOR';
  const { run: fetchRoom, error: roomError } = useAsyncAction(roomService.getById);
  const { run: fetchProblems, isLoading } = useAsyncAction(problemService.list);

  useEffect(() => {
    if (!id) return;
    fetchRoom(id).then((res) => res.ok && setRoom(res.data));
    fetchProblems(id).then((res) => res.ok && setProblems(res.data as Problem[]));
  }, [id, fetchRoom, fetchProblems]);

  function handleSuccess(newProblem: Problem) {
    setProblems((curr) => [...curr, newProblem]);
    setIsCreateModalOpen(false);
    notify({ tone: 'success', message: 'Problema criado com sucesso!' });
  }

  const filtered = problems.filter((p) => p.titulo.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <RoomProblemsHeader room={room} userNome={user?.nome} />
      <RoomProblemsMain
        roomError={roomError}
        isProfessor={isProfessor}
        roomId={id ?? ''}
        query={query}
        setQuery={setQuery}
        isLoading={isLoading}
        problems={filtered}
      />
      <ProblemsFabMenu isProfessor={isProfessor} onOpenCreate={() => setIsCreateModalOpen(true)} />
      <ProblemFormModal
        isOpen={isCreateModalOpen}
        roomId={id ?? ''}
        initialData={null}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
