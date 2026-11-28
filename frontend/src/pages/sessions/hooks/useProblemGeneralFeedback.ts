import { useCallback, useEffect, useState } from 'react';
import { feedbackService } from '@/services/feedback.service';
import type { GeneralFeedbackResponse } from '@/types/feedback';

function resolveLoadError(err: unknown): string {
  return (
    (err as { message?: string })?.message || 'Não foi possível carregar o feedback geral da turma.'
  );
}

export function useProblemGeneralFeedback(roomId: string, problemId: string, isProfessor: boolean) {
  const canLoad = isProfessor && Boolean(roomId && problemId);
  const [feedback, setFeedback] = useState<GeneralFeedbackResponse | null>(null);
  const [isLoading, setIsLoading] = useState(canLoad);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!canLoad) return;
    let active = true;

    feedbackService
      .getProblemFeedbacks(roomId, problemId)
      .then((response) => {
        if (!active) return;
        setFeedback(response.geral ?? null);
        setError(null);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(resolveLoadError(err));
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canLoad, roomId, problemId, reloadCount]);

  const reload = useCallback(() => {
    if (!canLoad) return;
    setIsLoading(true);
    setError(null);
    setReloadCount((count) => count + 1);
  }, [canLoad]);

  return { feedback, setFeedback, isLoading, error, reload };
}
