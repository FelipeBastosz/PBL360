import { Link } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import type { Room, RoomTutor } from '@/types/room';
import { TransferRoomOwnershipModal } from './TransferRoomOwnershipModal';
import { useTransferRoomOwnership } from './hooks/useTransferRoomOwnership';

type TransferRoomOwnershipSectionProps = {
  room: Room;
  onTransferred?: (newOwnerId: string) => void;
};

function EmptyTutorsNotice({ roomId }: { roomId: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-black/10 bg-surface/50 p-4">
      <h3 className="text-sm font-semibold text-brand-900">Transferência de propriedade</h3>
      <p className="text-xs text-muted leading-relaxed">
        Nenhum outro professor está vinculado a esta turma no momento. Para transferir a
        propriedade, convide outro professor através da lista de participantes.
      </p>
      <Link
        to={`/turmas/${roomId}/participantes`}
        className="mt-1 self-start text-xs font-semibold text-brand-900 hover:underline"
      >
        Ver participantes e convidar
      </Link>
    </div>
  );
}

function TransferCardHeader() {
  return (
    <div>
      <h3 id="transfer-room-heading" className="text-base font-bold text-brand-900">
        Transferir propriedade da turma
      </h3>
      <p className="mt-0.5 text-xs text-muted">
        Escolha outro professor vinculado para assumir a titularidade. Você continuará como
        co-tutor.
      </p>
    </div>
  );
}

type TransferSelectFormProps = {
  selectedTutorId: string;
  setSelectedTutorId: (id: string) => void;
  eligibleTutors: RoomTutor[];
  isTransferring: boolean;
  onSubmit: () => void;
};

function TransferSelectForm({
  selectedTutorId,
  setSelectedTutorId,
  eligibleTutors,
  isTransferring,
  onSubmit,
}: TransferSelectFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <SelectField
        label="Novo professor responsável"
        placeholder="Selecione um professor..."
        value={selectedTutorId}
        onChange={setSelectedTutorId}
        options={eligibleTutors.map((t) => ({ value: t.id, label: t.nome }))}
      />
      <Button
        type="submit"
        variant="outline"
        disabled={!selectedTutorId || isTransferring}
        className="self-start text-xs h-9 px-4"
      >
        Transferir propriedade
      </Button>
    </form>
  );
}

type TransferFormContentProps = {
  room: Room;
  onTransferred?: (newOwnerId: string) => void;
};

function TransferFormContent({ room, onTransferred }: TransferFormContentProps) {
  const {
    eligibleTutors,
    selectedTutorId,
    setSelectedTutorId,
    selectedTutor,
    isLoadingTutors,
    tutorsError,
    isModalOpen,
    openModal,
    closeModal,
    isTransferring,
    transferError,
    confirmTransfer,
  } = useTransferRoomOwnership({
    roomId: room.id,
    currentOwnerId: room.professorResponsavelId,
    onTransferred,
  });

  if (isLoadingTutors) {
    return (
      <div className="flex justify-center py-4">
        <Spinner className="size-6 text-brand-900" />
      </div>
    );
  }
  if (tutorsError) return <Alert tone="error">{tutorsError}</Alert>;
  if (eligibleTutors.length === 0) return <EmptyTutorsNotice roomId={room.id} />;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <TransferCardHeader />
      <TransferSelectForm
        selectedTutorId={selectedTutorId}
        setSelectedTutorId={setSelectedTutorId}
        eligibleTutors={eligibleTutors}
        isTransferring={isTransferring}
        onSubmit={openModal}
      />
      <TransferRoomOwnershipModal
        isOpen={isModalOpen}
        targetTutorName={selectedTutor?.nome ?? ''}
        isLoading={isTransferring}
        errorMessage={transferError}
        onConfirm={confirmTransfer}
        onClose={closeModal}
      />
    </div>
  );
}

export function TransferRoomOwnershipSection({
  room,
  onTransferred,
}: TransferRoomOwnershipSectionProps) {
  const { user } = useAuth();
  const isOwner =
    room.professorResponsavelId === user?.id || room.professorResponsavel?.id === user?.id;

  if (!isOwner) return null;

  return (
    <section aria-labelledby="transfer-room-heading" className="mt-6 flex flex-col gap-2">
      <TransferFormContent room={room} onTransferred={onTransferred} />
    </section>
  );
}
