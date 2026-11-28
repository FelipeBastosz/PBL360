import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import type { RoomTutor } from '@/types/room';
import { TransferRoomConfirmModal } from './TransferRoomConfirmModal';

export type TransferRoomModalProps = {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  eligibleTutors: RoomTutor[];
  onTransferred: (newOwnerId: string) => void;
  onInviteCoTutor: () => void;
};

function ModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-900">
        <UserPlusIcon className="size-6" aria-hidden="true" />
      </div>
      <h2 id="transfer-room-title" className="text-xl font-bold text-ink">
        Transferir propriedade da turma
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 rounded-full p-1 text-ink/60 hover:bg-black/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-900"
      >
        <XMarkIcon className="size-6" />
      </button>
    </div>
  );
}

function EmptyTutorsBody({ onInvite, onCancel }: { onInvite: () => void; onCancel: () => void }) {
  return (
    <div className="mt-3 flex flex-col gap-4">
      <div className="rounded-xl bg-surface p-3 text-center">
        <p className="text-xs text-muted leading-relaxed">
          Não há outros professores vinculados a esta turma no momento. Para transferir a
          propriedade, você precisa primeiro adicionar um co-tutor.
        </p>
      </div>
      <div className="mt-2 flex w-full flex-col gap-2">
        <Button
          type="button"
          onClick={onInvite}
          className="w-full bg-brand-900 text-white hover:bg-brand-800"
        >
          Adicionar co-tutor
        </Button>
        <Button
          type="button"
          variant="link"
          onClick={onCancel}
          className="text-muted hover:text-ink"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function SelectTutorBody({
  eligibleTutors,
  selectedTutorId,
  onSelectTutor,
  onTransfer,
  onCancel,
}: {
  eligibleTutors: RoomTutor[];
  selectedTutorId: string;
  onSelectTutor: (id: string) => void;
  onTransfer: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-3 flex flex-col gap-4">
      <div className="rounded-xl bg-surface p-3 text-center">
        <p className="text-xs text-muted leading-relaxed">
          Você deixará de ser o responsável principal desta turma e passará a atuar como{' '}
          <strong className="text-ink">co-tutor</strong>. O novo responsável assumirá a gestão da
          turma.
        </p>
      </div>
      <SelectField
        label="Novo professor responsável"
        placeholder="Selecione um professor..."
        value={selectedTutorId}
        onChange={onSelectTutor}
        options={eligibleTutors.map((t) => ({ value: t.id, label: t.nome }))}
      />
      <div className="mt-2 flex w-full flex-col gap-2">
        <Button
          type="button"
          disabled={!selectedTutorId}
          onClick={onTransfer}
          className="w-full bg-brand-900 text-white hover:bg-brand-800"
        >
          Transferir
        </Button>
        <Button
          type="button"
          variant="link"
          onClick={onCancel}
          className="text-muted hover:text-ink"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function TransferDialog({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-room-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative max-h-full w-full max-w-sm overflow-y-auto rounded-[24px] border border-black/5 bg-white p-6 shadow-2xl animate-pop-in">
        <ModalHeader onClose={onClose} />
        {children}
      </div>
    </div>
  );
}

function useTransferMutation(
  roomId: string,
  onTransferred: (id: string) => void,
  onClose: () => void,
) {
  const { notify } = useToast();
  const [transferError, setTransferError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { run: executeTransfer, isLoading } = useAsyncAction(roomService.transferOwnership);

  const confirmTransfer = async (selectedTutorId: string) => {
    if (!selectedTutorId || isLoading) return;
    setTransferError(null);
    const res = await executeTransfer(roomId, { professorId: selectedTutorId });
    if (res.ok) {
      notify({ tone: 'success', message: 'Propriedade da turma transferida com sucesso!' });
      setIsConfirmOpen(false);
      onTransferred(res.data.professorResponsavelId);
      onClose();
      return;
    }
    const message = res.error?.message || 'Não foi possível transferir a propriedade da turma.';
    setTransferError(message);
    notify({ tone: 'error', message });
  };

  return {
    isConfirmOpen,
    setIsConfirmOpen,
    isLoading,
    transferError,
    setTransferError,
    confirmTransfer,
  };
}

export function TransferRoomModal({
  isOpen,
  onClose,
  roomId,
  eligibleTutors,
  onTransferred,
  onInviteCoTutor,
}: TransferRoomModalProps) {
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const mutation = useTransferMutation(roomId, onTransferred, onClose);

  useEscapeKey(isOpen && !mutation.isConfirmOpen, onClose);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSelectedTutorId('');
      mutation.setIsConfirmOpen(false);
      mutation.setTransferError(null);
    }
  }

  const selectedTutor = eligibleTutors.find((t) => t.id === selectedTutorId);

  return (
    <>
      <TransferDialog isOpen={isOpen} onClose={onClose}>
        {eligibleTutors.length === 0 ? (
          <EmptyTutorsBody onInvite={onInviteCoTutor} onCancel={onClose} />
        ) : (
          <SelectTutorBody
            eligibleTutors={eligibleTutors}
            selectedTutorId={selectedTutorId}
            onSelectTutor={setSelectedTutorId}
            onTransfer={() => mutation.setIsConfirmOpen(true)}
            onCancel={onClose}
          />
        )}
      </TransferDialog>
      <TransferRoomConfirmModal
        isOpen={mutation.isConfirmOpen}
        onClose={() => mutation.setIsConfirmOpen(false)}
        targetTutorName={selectedTutor?.nome ?? ''}
        isLoading={mutation.isLoading}
        errorMessage={mutation.transferError}
        onConfirm={() => mutation.confirmTransfer(selectedTutorId)}
      />
    </>
  );
}
