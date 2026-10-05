import { useCallback, useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { toApiError } from '@/services/apiError';
import { roomService } from '@/services/room.service';
import type { RoomTutor, TutorSummary } from '@/types/room';

export function useRoomTutors(roomId: string) {
  const { notify } = useToast();
  const [tutors, setTutors] = useState<RoomTutor[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { run: load, isLoading, error } = useAsyncAction(roomService.listTutors);

  const reload = useCallback(async () => {
    const result = await load(roomId);
    if (result.ok) setTutors(result.data);
  }, [load, roomId]);

  useEffect(() => {
    load(roomId).then((result) => result.ok && setTutors(result.data));
  }, [load, roomId]);

  const runChange = useCallback(
    async (tutorId: string, change: () => Promise<unknown>, success: string) => {
      setPendingId(tutorId);
      try {
        await change();
        notify({ tone: 'success', message: success });
        await reload();
        return true;
      } catch (caught) {
        notify({ tone: 'error', message: toApiError(caught).message });
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [notify, reload],
  );

  const add = (tutor: TutorSummary) =>
    runChange(
      tutor.id,
      () => roomService.addTutor(roomId, { professorId: tutor.id }),
      `${tutor.nome} agora também é professor desta turma.`,
    );

  const remove = (tutor: RoomTutor) =>
    runChange(
      tutor.id,
      () => roomService.removeTutor(roomId, tutor.id),
      `${tutor.nome} foi removido da turma.`,
    );

  return { tutors, isLoading, error, pendingId, add, remove };
}
