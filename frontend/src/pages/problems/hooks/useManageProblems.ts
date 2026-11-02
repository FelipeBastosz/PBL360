import { useState, useEffect, useCallback } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { problemService } from '@/services/problem.service';
import { roomService } from '@/services/room.service';
import type { Problem } from '@/types/problem';
import type { Room } from '@/types/room';
import { useProblemDeletion } from './useProblemDeletion';

export function useManageProblems(id: string | undefined) {
  const { notify } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemToEdit, setProblemToEdit] = useState<Problem | null>(null);

  const { run: fetchRoom } = useAsyncAction(roomService.getById);
  const { run: fetchProblems, isLoading } = useAsyncAction(problemService.list);
  const deletion = useProblemDeletion(id, setProblems);

  useEffect(() => {
    if (!id) return;
    fetchRoom(id).then((r) => r.ok && setRoom(r.data));
    fetchProblems(id).then((r) => r.ok && setProblems(r.data as Problem[]));
  }, [id, fetchRoom, fetchProblems]);

  const handleEditSuccess = useCallback(
    (updated: Problem & { title?: string }) => {
      const tituloCorreto = updated.titulo || updated.title || '';
      const problemNormalizado = { ...updated, titulo: tituloCorreto };
      setProblems((curr) =>
        curr.map((item) => (item.id === problemNormalizado.id ? problemNormalizado : item)),
      );
      setProblemToEdit(null);
      notify({ tone: 'success', message: 'Problema atualizado com sucesso!' });
    },
    [notify],
  );

  return {
    room,
    problems,
    isLoading,
    problemToEdit,
    setProblemToEdit,
    handleEditSuccess,
    ...deletion,
  };
}
