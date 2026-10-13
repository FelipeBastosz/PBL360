import { useCallback, useEffect, useRef, useState } from 'react';
import { type ApiError, toApiError } from '@/services/apiError';

type ActionResult<R> = { ok: true; data: R } | { ok: false; error: ApiError };

export function useAsyncAction<A extends unknown[], R>(action: (...args: A) => Promise<R>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  // A request can settle after the screen is gone (navigation, test teardown); its state
  // updates must then be dropped.
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args: A): Promise<ActionResult<R>> => {
      setIsLoading(true);
      setError(null);
      try {
        return { ok: true, data: await action(...args) };
      } catch (caught) {
        const apiError = toApiError(caught);
        if (isMounted.current) setError(apiError);
        return { ok: false, error: apiError };
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    },
    [action],
  );

  const clearError = useCallback(() => setError(null), []);

  return { run, isLoading, error, clearError };
}
