import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { FabMenu } from '@/components/ui/FabMenu';
import { SearchField } from '@/components/ui/SearchField';
import { CARD_GRID_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { memberRoomService, type RoomHeading } from '@/services/memberRoom.service';
import { problemService } from '@/services/problem.service';
import { ROUTES } from '@/routes/paths';
import type { Room } from '@/types/room';
import type { Problem } from '@/types/problem';
import { ProblemsEmptyState } from './ProblemsEmptyState';
import { ProblemCard } from './ProblemCard';
import { RoomProblemsHeader } from './RoomProblemsHeader';
import { RoomTopActions } from './RoomTopActions';
import { RoomChat } from './chat/RoomChat';
import { RoomProblemsModals } from './RoomProblemsModals';
import { useRoomProblemsModals } from './hooks/useRoomProblemsModals';

function ProblemsFab({
  roomId,
  onCreate,
  onTransfer,
}: {
  roomId: string;
  onCreate: () => void;
  onTransfer?: () => void;
}) {
  const actions = [
    { label: 'Editar um problema', to: `/turmas/${roomId}/problemas/gerenciar` },
    { label: 'Criar novo problema', onClick: onCreate },
    ...(onTransfer ? [{ label: 'Transferir turma', onClick: onTransfer }] : []),
  ];

  return <FabMenu label="Ações de problema" actions={actions} />;
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
  isLoading: boolean;
  problems: Problem[];
  onInvite: () => void;
};

function RoomProblemsMain({
  roomError,
  isProfessor,
  roomId,
  isLoading,
  problems: allProblems,
  onInvite,
}: MainProps) {
  const [query, setQuery] = useState('');
  if (roomError) return <RoomUnavailable message={roomError.message} />;
  const problems = allProblems.filter((p) => p.titulo.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-4')}>
      <RoomTopActions isProfessor={isProfessor} roomId={roomId} onInvite={onInvite} />
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

const isFullRoom = (room: Room | RoomHeading | null): room is Room =>
  !!room && 'codigoSala' in room;

function useRoomWithProblems(id: string | undefined) {
  const isProfessor = useAuth().user?.tipo === 'PROFESSOR';
  const [room, setRoom] = useState<Room | RoomHeading | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const { run: fetchRoom, error: roomError } = useAsyncAction(memberRoomService.room);
  const { run: fetchProblems, isLoading } = useAsyncAction(problemService.list);

  useEffect(() => {
    if (!id) return;
    fetchRoom(id, isProfessor).then((res) => res.ok && setRoom(res.data));
    fetchProblems(id).then((res) => res.ok && setProblems(res.data as Problem[]));
  }, [id, isProfessor, fetchRoom, fetchProblems]);

  return { room, setRoom, problems, setProblems, roomError, isLoading };
}

export default function RoomProblemsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { room, setRoom, problems, setProblems, roomError, isLoading } = useRoomWithProblems(id);
  const modals = useRoomProblemsModals(id, user?.id, setRoom, setProblems);
  const isProfessor = user?.tipo === 'PROFESSOR';
  const isOwner = isFullRoom(room) && room.professorResponsavelId === user?.id;

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <RoomProblemsHeader room={room} user={user} />
      <RoomProblemsMain
        roomError={roomError}
        isProfessor={isProfessor}
        roomId={id ?? ''}
        isLoading={isLoading}
        problems={problems}
        onInvite={modals.openInviteStudents}
      />
      {isProfessor && (
        <ProblemsFab
          roomId={id ?? ''}
          onCreate={modals.openCreate}
          onTransfer={isOwner ? modals.handleTransferClick : undefined}
        />
      )}
      {room && user && !roomError && (
        <RoomChat roomId={room.id} isProfessor={isProfessor} currentUserId={user.id} />
      )}
      <RoomProblemsModals room={room} user={user} modals={modals} />
    </div>
  );
}
