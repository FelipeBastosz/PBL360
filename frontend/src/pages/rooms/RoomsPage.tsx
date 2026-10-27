import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { FabMenu, type FabAction } from '@/components/ui/FabMenu';
import { SearchField } from '@/components/ui/SearchField';
import {
  CARD_ACCENT_CLASS,
  CARD_GRID_CLASS,
  INTERACTIVE_CARD_CLASS,
  PAGE_CONTAINER_CLASS,
} from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { roomService } from '@/services/room.service';
import { ROUTES } from '@/routes/paths';
import type { Room } from '@/types/room';
import { countLabel } from '@/utils/countLabel';
import { JoinRoomSheet } from './JoinRoomSheet';
import { LeaveRoomModal } from './LeaveRoomModal';
import { useRooms } from './hooks/useRooms';

const TUTOR_ACTIONS: FabAction[] = [
  { label: 'Editar uma turma', to: ROUTES.manageRooms },
  { label: 'Criar nova turma', to: ROUTES.createRoom },
];

function RoomsEmptyState({ isStudent }: { isStudent: boolean }) {
  return (
    <div className="mt-20 flex flex-col items-center justify-center px-6 text-center">
      <p className="text-base font-semibold text-ink">
        {isStudent
          ? 'Você ainda não faz parte de nenhuma turma.'
          : 'Você ainda não possui turmas cadastradas.'}
      </p>
      <p className="mt-1 text-sm text-muted">
        Toque no <span className="font-bold text-brand-900">+</span> para começar.
      </p>
    </div>
  );
}

type RoomCardProps = {
  room: Room;
  professorNome?: string;
  canLeave?: boolean;
  onLeaveRequest?: (room: Room) => void;
};

function RoomCard({ room, professorNome, canLeave, onLeaveRequest }: RoomCardProps) {
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
        {canLeave && onLeaveRequest && (
          <div className="mt-1 flex justify-end border-t border-black/5 pt-2">
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

type RoomsListProps = {
  isLoading: boolean;
  rooms: Room[];
  isStudent: boolean;
  hasFilter: boolean;
  userNome?: string;
  userId?: string;
  onLeaveRequest: (room: Room) => void;
};

function RoomsList({
  isLoading,
  rooms,
  isStudent,
  hasFilter,
  userNome,
  userId,
  onLeaveRequest,
}: RoomsListProps) {
  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return hasFilter ? (
      <p className="mt-10 text-center text-sm text-muted">Nenhuma turma encontrada.</p>
    ) : (
      <RoomsEmptyState isStudent={isStudent} />
    );
  }

  return (
    <div className={cn(CARD_GRID_CLASS, 'mt-4')}>
      {rooms.map((room) => {
        const isOwner = !isStudent && Boolean(userId) && room.professorResponsavelId === userId;
        return (
          <RoomCard
            key={room.id}
            room={room}
            professorNome={isStudent ? undefined : userNome}
            canLeave={!isOwner}
            onLeaveRequest={onLeaveRequest}
          />
        );
      })}
    </div>
  );
}

type RoomsContentProps = {
  isLoading: boolean;
  rooms: Room[];
  error: { message: string } | null;
  isStudent: boolean;
  hasFilter: boolean;
  userNome?: string;
  userId?: string;
  onLeaveRequest: (room: Room) => void;
};

function RoomsContent({
  isLoading,
  rooms,
  error,
  isStudent,
  hasFilter,
  userNome,
  userId,
  onLeaveRequest,
}: RoomsContentProps) {
  return (
    <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6')}>
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
        Minhas turmas · {rooms.length}
      </h2>
      {error && (
        <Alert tone="error" className="mt-4">
          {error.message}
        </Alert>
      )}
      <RoomsList
        isLoading={isLoading}
        rooms={rooms}
        isStudent={isStudent}
        hasFilter={hasFilter}
        userNome={userNome}
        userId={userId}
        onLeaveRequest={onLeaveRequest}
      />
    </main>
  );
}

function useLeaveRoom(onSuccess: (roomId: string) => void) {
  const { notify } = useToast();
  const [roomToLeave, setRoomToLeave] = useState<Room | null>(null);
  const { run, isLoading } = useAsyncAction(roomService.leaveRoom);

  const confirmLeave = async () => {
    if (!roomToLeave) return;
    const result = await run(roomToLeave.id);
    if (result.ok) {
      onSuccess(roomToLeave.id);
      notify({ tone: 'success', message: 'Você saiu da turma com sucesso.' });
      setRoomToLeave(null);
    }
  };

  return {
    roomToLeave,
    isLeaving: isLoading,
    requestLeave: setRoomToLeave,
    confirmLeave,
    cancelLeave: () => setRoomToLeave(null),
  };
}

export default function RoomsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const isStudent = user?.tipo === 'ALUNO';
  const { rooms, setRooms, isLoading, error, reload } = useRooms(isStudent);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const { roomToLeave, isLeaving, requestLeave, confirmLeave, cancelLeave } = useLeaveRoom(
    (roomId) => setRooms((current) => current.filter((r) => r.id !== roomId)),
  );

  const studentActions: FabAction[] = [
    { label: 'Entrar em uma turma', onClick: () => setIsJoinOpen(true) },
  ];

  const filteredRooms = rooms.filter((r) => r.nome.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <AppHeader />
      <div className={cn(PAGE_CONTAINER_CLASS, 'mt-4')}>
        <SearchField label="Pesquisar turma" value={query} onChange={setQuery} />
      </div>

      <RoomsContent
        isLoading={isLoading}
        rooms={filteredRooms}
        error={error}
        isStudent={isStudent}
        hasFilter={query.length > 0}
        userNome={user?.nome}
        userId={user?.id}
        onLeaveRequest={requestLeave}
      />

      <FabMenu label="Ações de turma" actions={isStudent ? studentActions : TUTOR_ACTIONS} />
      {isStudent && (
        <JoinRoomSheet
          isOpen={isJoinOpen}
          onClose={() => setIsJoinOpen(false)}
          onJoined={() => {
            setIsJoinOpen(false);
            reload();
          }}
        />
      )}
      <LeaveRoomModal
        roomName={roomToLeave?.nome ?? ''}
        isOpen={Boolean(roomToLeave)}
        isLoading={isLeaving}
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />
    </div>
  );
}
