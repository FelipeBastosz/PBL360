import type { UserResponse } from '@/types/auth';
import type { Room } from '@/types/room';
import type { RoomHeading } from '@/services/memberRoom.service';
import { ProblemFormModal } from './ProblemFormModal';
import { RoomInviteSheet } from '../rooms/invite/RoomInviteSheet';
import { TransferRoomModal } from '../rooms/TransferRoomModal';
import type { useRoomProblemsModals } from './hooks/useRoomProblemsModals';

const isFullRoom = (room: Room | RoomHeading | null): room is Room =>
  !!room && 'codigoSala' in room;

type RoomProblemsModalsProps = {
  room: Room | RoomHeading | null;
  user: UserResponse | null;
  modals: ReturnType<typeof useRoomProblemsModals>;
};

export function RoomProblemsModals({ room, user, modals }: RoomProblemsModalsProps) {
  const isProfessor = user?.tipo === 'PROFESSOR';
  const isOwner = isFullRoom(room) && room.professorResponsavelId === user?.id;

  return (
    <>
      <ProblemFormModal
        isOpen={modals.isCreateOpen}
        roomId={room?.id ?? ''}
        initialData={null}
        onClose={modals.closeCreate}
        onSuccess={modals.handleCreateSuccess}
      />
      {isFullRoom(room) && isProfessor && (
        <RoomInviteSheet
          isOpen={modals.isInviteOpen}
          onClose={modals.closeInvite}
          roomId={room.id}
          roomName={room.nome}
          roomCode={room.codigoSala}
          isOwner={isOwner}
          initialTab={modals.inviteTab}
          onTutorAdded={modals.handleTutorAdded}
        />
      )}
      {isFullRoom(room) && isOwner && (
        <TransferRoomModal
          isOpen={modals.isTransferOpen}
          onClose={modals.closeTransfer}
          roomId={room.id}
          eligibleTutors={modals.eligibleTutors}
          onTransferred={modals.handleTransferred}
          onInviteCoTutor={modals.startInviteCoTutor}
        />
      )}
    </>
  );
}
