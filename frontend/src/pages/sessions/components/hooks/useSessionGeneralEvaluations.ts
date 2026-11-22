import { useCallback, useEffect, useState } from 'react';
import { sessionService } from '@/services/session.service';
import type { SessionGeneralEvaluation } from '@/types/session';

function resolveErrorMessage(err: unknown): string {
  return (
    (err as { message?: string })?.message ||
    'Não foi possível carregar o feedback geral da sessão.'
  );
}

export function useSessionGeneralEvaluations(sessionId?: string) {
  const isAvailable = Boolean(sessionId && sessionService?.getGeneralEvaluations);
  const [evaluations, setEvaluations] = useState<SessionGeneralEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(isAvailable);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluations = useCallback(async (id: string) => {
    if (typeof sessionService?.getGeneralEvaluations !== 'function') return;
    setIsLoading(true);
    setError(null);
    try {
      setEvaluations(await sessionService.getGeneralEvaluations(id));
    } catch (err: unknown) {
      setError(resolveErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionId || typeof sessionService?.getGeneralEvaluations !== 'function') return;
    let isCurrent = true;
    sessionService
      .getGeneralEvaluations(sessionId)
      .then((data) => {
        if (!isCurrent) return;
        setEvaluations(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isCurrent) return;
        setError(resolveErrorMessage(err));
        setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [sessionId]);

  const reload = useCallback(() => {
    if (sessionId) fetchEvaluations(sessionId);
  }, [sessionId, fetchEvaluations]);

  return { evaluations, setEvaluations, isLoading, error, reload };
}
