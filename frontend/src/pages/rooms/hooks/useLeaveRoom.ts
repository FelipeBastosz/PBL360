import { useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { roomService } from '@/services/room.service';
import type { Room } from '@/types/room';

export function useLeaveRoom(onSuccess: (roomId: string) => void) {
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
    } else {
      notify({ tone: 'error', message: result.error.message });
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
