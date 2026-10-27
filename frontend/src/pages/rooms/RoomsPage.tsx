import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { SearchField } from '@/components/ui/SearchField';
import { CARD_GRID_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import type { Room } from '@/types/room';
import { JoinRoomSheet } from './JoinRoomSheet';
import { LeaveRoomModal } from './LeaveRoomModal';
import { RoomCard } from './RoomCard';
import { RoomsFab } from './RoomsFab';
import { useRooms } from './hooks/useRooms';
import { useLeaveRoom } from './hooks/useLeaveRoom';

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

type RoomsListProps = {
  isLoading: boolean;
  rooms: Room[];
  isStudent: boolean;
  hasFilter: boolean;
  userNome?: string;
  userId?: string;
  isLeaveMode: boolean;
  onLeaveRequest: (room: Room) => void;
};

function RoomsList({
  isLoading,
  rooms,
  isStudent,
  hasFilter,
  userNome,
  userId,
  isLeaveMode,
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
            canLeave={isLeaveMode && !isOwner}
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
  isLeaveMode: boolean;
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
  isLeaveMode,
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
        isLeaveMode={isLeaveMode}
        onLeaveRequest={onLeaveRequest}
      />
    </main>
  );
}

type RoomsModalsProps = {
  isStudent: boolean;
  isJoinOpen: boolean;
  onCloseJoin: () => void;
  onReload: () => void;
  leaveState: ReturnType<typeof useLeaveRoom>;
};

function RoomsModals({
  isStudent,
  isJoinOpen,
  onCloseJoin,
  onReload,
  leaveState,
}: RoomsModalsProps) {
  const { roomToLeave, isLeaving, confirmLeave, cancelLeave } = leaveState;
  return (
    <>
      {isStudent && (
        <JoinRoomSheet
          isOpen={isJoinOpen}
          onClose={onCloseJoin}
          onJoined={() => {
            onCloseJoin();
            onReload();
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
    </>
  );
}

export default function RoomsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isLeaveMode, setIsLeaveMode] = useState(false);
  const isStudent = user?.tipo === 'ALUNO';
  const { rooms, setRooms, isLoading, error, reload } = useRooms(isStudent);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const leave = useLeaveRoom((id) => setRooms((current) => current.filter((r) => r.id !== id)));

  const filteredRooms = rooms.filter((r) => r.nome.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className={cn('min-h-dvh bg-surface', isLeaveMode ? 'pb-36' : 'pb-24')}>
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
        isLeaveMode={isLeaveMode}
        onLeaveRequest={leave.requestLeave}
      />

      <RoomsFab
        isLeaveMode={isLeaveMode}
        isStudent={isStudent}
        onFinishLeave={() => setIsLeaveMode(false)}
        onStartLeave={() => setIsLeaveMode(true)}
        onOpenJoin={() => setIsJoinOpen(true)}
      />
      <RoomsModals
        isStudent={isStudent}
        isJoinOpen={isJoinOpen}
        onCloseJoin={() => setIsJoinOpen(false)}
        onReload={reload}
        leaveState={leave}
      />
    </div>
  );
}
