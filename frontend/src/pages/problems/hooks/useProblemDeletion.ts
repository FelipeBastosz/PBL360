import { useState, useCallback } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { problemService } from '@/services/problem.service';
import type { Problem, ProblemDeletionImpact } from '@/types/problem';
import { formatProblemDeletionConflict } from '@/utils/deletionConflict';

async function fetchImpact(roomId: string, problemId: string): Promise<ProblemDeletionImpact> {
  return problemService
    .getDeletionImpact(roomId, problemId)
    .catch(() => ({ sessoes: 0, notas: 0, feedbacks: 0, avaliacoes: 0 }));
}

export function useProblemDeletion(
  id: string | undefined,
  setProblems: React.Dispatch<React.SetStateAction<Problem[]>>,
) {
  const { notify } = useToast();
  const [problemToDelete, setProblemToDelete] = useState<Problem | null>(null);
  const [impact, setImpact] = useState<ProblemDeletionImpact | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { run: deleteProblem, isLoading: isDeleting } = useAsyncAction(problemService.remove);

  const onOpenDelete = useCallback(
    async (p: Problem) => {
      setErrorMessage(null);
      setImpact(null);
      setProblemToDelete(p);
      if (id) setImpact(await fetchImpact(id, p.id));
    },
    [id],
  );

  const onCancelDelete = useCallback(() => {
    setProblemToDelete(null);
    setImpact(null);
    setErrorMessage(null);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!id || !problemToDelete) return;
    setErrorMessage(null);
    const res = await deleteProblem(id, problemToDelete.id);
    if (res.ok) {
      setProblems((curr) => curr.filter((item) => item.id !== problemToDelete.id));
      onCancelDelete();
      notify({ tone: 'success', message: 'Problema excluído com sucesso!' });
      return;
    }
    const message = formatProblemDeletionConflict(res.error) ?? res.error.message;
    setErrorMessage(message);
    notify({ tone: 'error', message });
  }, [id, problemToDelete, deleteProblem, setProblems, notify, onCancelDelete]);

  return {
    problemToDelete,
    impact,
    isDeleting,
    errorMessage,
    onOpenDelete,
    onCancelDelete,
    onConfirmDelete,
  };
}
