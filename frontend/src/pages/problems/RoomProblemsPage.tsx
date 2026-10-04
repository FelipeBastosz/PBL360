import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { FabMenu } from '@/components/ui/FabMenu';
import { SearchField } from '@/components/ui/SearchField';
import { CARD_GRID_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import { problemService } from '@/services/problem.service';
import { ROUTES } from '@/routes/paths';
import type { Room } from '@/types/room';
import type { Problem } from '@/types/problem';
import { ProblemsEmptyState } from './ProblemsEmptyState';
import { ProblemFormModal } from './ProblemFormModal';
import { ProblemCard } from './ProblemCard';
import { RoomProblemsHeader } from './RoomProblemsHeader';
import { RoomTopActions } from './RoomTopActions';

function ProblemsFab({ roomId, onCreate }: { roomId: string; onCreate: () => void }) {
  return (
    <FabMenu
      label="Ações de problema"
      actions={[
        { label: 'Editar um problema', to: `/turmas/${roomId}/problemas/gerenciar` },
        { label: 'Criar novo problema', onClick: onCreate },
      ]}
    />
  );
}

function RoomUnavailable({ message }: { message: string }) {
  return (
    <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col items-center gap-6')}>
      <div className="w-full animate-shake">
        <Alert tone="error">{message}</Alert>
      </div>
      <Link
        to={ROUTES.rooms}
        className="rounded-xl border border-brand-900 bg-white px-5 py-3 font-semibold text-brand-900 transition-[background-color,scale] duration-200 hover:bg-brand-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-brand-900"
      >
        Ver minhas turmas
      </Link>
    </main>
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
  if (roomError) return <RoomUnavailable message={roomError.message} />;

  return (
    <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-4')}>
      <RoomTopActions isProfessor={isProfessor} roomId={roomId} />
      <SearchField label="Pesquisar problema" value={query} onChange={setQuery} className="mt-2" />
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
        <div className={cn(CARD_GRID_CLASS, 'mt-2')}>
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
      <RoomProblemsHeader room={room} user={user} />
      <RoomProblemsMain
        roomError={roomError}
        isProfessor={isProfessor}
        roomId={id ?? ''}
        query={query}
        setQuery={setQuery}
        isLoading={isLoading}
        problems={filtered}
      />
      {isProfessor && <ProblemsFab roomId={id ?? ''} onCreate={() => setIsCreateModalOpen(true)} />}
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
