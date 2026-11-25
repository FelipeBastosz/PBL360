import { useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { roomService } from '@/services/room.service';
import type { RoomTutor } from '@/types/room';

type UseTransferRoomOwnershipProps = {
  roomId: string;
  currentOwnerId?: string;
  onTransferred?: (newOwnerId: string) => void;
};

function useOwnershipTransferMutation(
  roomId: string,
  onTransferred?: (newOwnerId: string) => void,
) {
  const { notify } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const { run: executeTransfer, isLoading: isTransferring } = useAsyncAction(
    roomService.transferOwnership,
  );

  const openModal = (hasSelected: boolean) => {
    setTransferError(null);
    if (hasSelected) setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!isTransferring) {
      setIsModalOpen(false);
      setTransferError(null);
    }
  };

  const confirmTransfer = async (selectedTutorId: string) => {
    if (!selectedTutorId || isTransferring) return;
    setTransferError(null);
    const res = await executeTransfer(roomId, { professorId: selectedTutorId });
    if (res.ok) {
      notify({ tone: 'success', message: 'Propriedade da turma transferida com sucesso!' });
      setIsModalOpen(false);
      onTransferred?.(res.data.professorResponsavelId);
      return;
    }
    const message = res.error?.message || 'Não foi possível transferir a propriedade da turma.';
    setTransferError(message);
    notify({ tone: 'error', message });
  };

  return { isModalOpen, openModal, closeModal, isTransferring, transferError, confirmTransfer };
}

export function useTransferRoomOwnership({
  roomId,
  currentOwnerId,
  onTransferred,
}: UseTransferRoomOwnershipProps) {
  const [tutors, setTutors] = useState<RoomTutor[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const {
    run: loadTutors,
    isLoading: isLoadingTutors,
    error: loadError,
  } = useAsyncAction(roomService.listTutors);
  const mutation = useOwnershipTransferMutation(roomId, onTransferred);

  useEffect(() => {
    if (roomId) loadTutors(roomId).then((res) => res.ok && setTutors(res.data));
  }, [roomId, loadTutors]);

  const eligibleTutors = tutors.filter((t) => t.id !== currentOwnerId);
  const selectedTutor = eligibleTutors.find((t) => t.id === selectedTutorId) ?? null;

  return {
    eligibleTutors,
    selectedTutorId,
    setSelectedTutorId,
    selectedTutor,
    isLoadingTutors,
    tutorsError: loadError ? 'Não foi possível carregar os professores da turma.' : null,
    isModalOpen: mutation.isModalOpen,
    openModal: () => mutation.openModal(Boolean(selectedTutorId)),
    closeModal: mutation.closeModal,
    isTransferring: mutation.isTransferring,
    transferError: mutation.transferError,
    confirmTransfer: () => mutation.confirmTransfer(selectedTutorId),
  };
}
