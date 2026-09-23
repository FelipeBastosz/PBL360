import { useCallback, useState } from 'react';
import { type ApiError, toApiError } from '@/services/apiError';

type ActionResult<R> = { ok: true; data: R } | { ok: false; error: ApiError };

export function useAsyncAction<A extends unknown[], R>(action: (...args: A) => Promise<R>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const run = useCallback(
    async (...args: A): Promise<ActionResult<R>> => {
      setIsLoading(true);
      setError(null);
      try {
        return { ok: true, data: await action(...args) };
      } catch (caught) {
        const apiError = toApiError(caught);
        setError(apiError);
        return { ok: false, error: apiError };
      } finally {
        setIsLoading(false);
      }
    },
    [action],
  );

  const clearError = useCallback(() => setError(null), []);

  return { run, isLoading, error, clearError };
}
