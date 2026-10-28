import { useState, useCallback } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { problemService } from '@/services/problem.service';
import type { Problem, ProblemDeletionImpact } from '@/types/problem';

export function useProblemDeletion(
  id: string | undefined,
  setProblems: React.Dispatch<React.SetStateAction<Problem[]>>,
) {
  const { notify } = useToast();
  const [problemToDelete, setProblemToDelete] = useState<Problem | null>(null);
  const [impact, setImpact] = useState<ProblemDeletionImpact | null>(null);
  const { run: deleteProblem, isLoading: isDeleting } = useAsyncAction(problemService.remove);

  const onOpenDelete = useCallback(
    async (p: Problem) => {
      setImpact(null);
      setProblemToDelete(p);
      if (!id) return;
      const data = await problemService
        .getDeletionImpact(id, p.id)
        .catch(() => ({ sessoes: 0, notas: 0, feedbacks: 0, avaliacoes: 0 }));
      setImpact(data);
    },
    [id],
  );

  const onCancelDelete = useCallback(() => {
    setProblemToDelete(null);
    setImpact(null);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!id || !problemToDelete) return;
    const res = await deleteProblem(id, problemToDelete.id);
    if (res.ok) {
      setProblems((curr) => curr.filter((item) => item.id !== problemToDelete.id));
      setProblemToDelete(null);
      setImpact(null);
      notify({ tone: 'success', message: 'Problema excluído com sucesso!' });
    } else {
      notify({ tone: 'error', message: res.error.message });
    }
  }, [id, problemToDelete, deleteProblem, setProblems, notify]);

  return {
    problemToDelete,
    impact,
    isDeleting,
    onOpenDelete,
    onCancelDelete,
    onConfirmDelete,
  };
}
