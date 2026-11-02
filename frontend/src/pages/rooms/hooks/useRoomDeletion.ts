import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { roomService } from '@/services/room.service';
import type { Room } from '@/types/room';

function checkIsOwner(room: Room | null, userId?: string): boolean {
  if (!room || !userId) return true;
  return room.professorResponsavelId === userId || room.professorResponsavel?.id === userId;
}

export function useRoomDeletion(setRooms: React.Dispatch<React.SetStateAction<Room[]>>) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { run: deleteRoom, isLoading: isDeleting } = useAsyncAction(roomService.remove);

  const isOwner = checkIsOwner(roomToDelete, user?.id);

  const onOpenDelete = useCallback((room: Room) => {
    setErrorMessage(null);
    setRoomToDelete(room);
  }, []);

  const onCancelDelete = useCallback(() => {
    setRoomToDelete(null);
    setErrorMessage(null);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!roomToDelete) return;
    setErrorMessage(null);

    const res = await deleteRoom(roomToDelete.id);
    if (res.ok) {
      setRooms((current) => current.filter((r) => r.id !== roomToDelete.id));
      onCancelDelete();
      notify({ tone: 'success', message: 'Turma excluída com sucesso!' });
      return;
    }

    const message =
      res.error?.message ||
      'Você não possui permissão para excluir esta turma. Apenas o professor responsável pode realizar a exclusão.';
    setErrorMessage(message);
    notify({ tone: 'error', message });
  }, [roomToDelete, deleteRoom, setRooms, onCancelDelete, notify]);

  return {
    roomToDelete,
    isOwner,
    isDeleting,
    errorMessage,
    onOpenDelete,
    onCancelDelete,
    onConfirmDelete,
  };
}
