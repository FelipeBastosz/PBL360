import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { FALLBACK_TERM_1_2 } from '@/content/legal';
import {
  commitmentTermsService,
  type CurrentCommitmentTerm,
} from '@/services/commitmentTerms.service';

export const LIVE_TERM_LOAD_ERROR =
  'Não foi possível carregar os Termos de Uso e Política de Privacidade vigentes. Tente novamente.';

type UseCurrentTermOptions = {
  enabled?: boolean;
  requireLiveTerm?: boolean;
  onLoaded?: (term: CurrentCommitmentTerm) => void;
};

type TermLoadState = {
  term: CurrentCommitmentTerm | null;
  isInitialLoading: boolean;
  isReloading: boolean;
  error: string | null;
};

function resolveLoadSuccess(
  prev: TermLoadState,
  data: CurrentCommitmentTerm | null | undefined,
  requireLiveTerm: boolean,
): TermLoadState {
  if (data) {
    return { term: data, error: null, isInitialLoading: false, isReloading: false };
  }
  return {
    ...prev,
    error: requireLiveTerm ? LIVE_TERM_LOAD_ERROR : prev.error,
    isInitialLoading: false,
    isReloading: false,
  };
}

function resolveLoadFailure(prev: TermLoadState, requireLiveTerm: boolean): TermLoadState {
  return {
    ...prev,
    error: requireLiveTerm ? LIVE_TERM_LOAD_ERROR : prev.error,
    isInitialLoading: false,
    isReloading: false,
  };
}

async function fetchTermIntoState(
  requireLiveTerm: boolean,
  isActive: () => boolean,
  setState: Dispatch<SetStateAction<TermLoadState>>,
  onLoadedRef: RefObject<((term: CurrentCommitmentTerm) => void) | undefined>,
): Promise<CurrentCommitmentTerm | null> {
  try {
    const data = await Promise.resolve(commitmentTermsService.getCurrentTerm?.());
    if (!isActive()) return data ?? null;
    setState((prev) => resolveLoadSuccess(prev, data, requireLiveTerm));
    if (data) onLoadedRef.current?.(data);
    return data ?? null;
  } catch {
    if (isActive()) setState((prev) => resolveLoadFailure(prev, requireLiveTerm));
    return null;
  }
}

export function useCurrentTerm({
  enabled = true,
  requireLiveTerm = true,
  onLoaded,
}: UseCurrentTermOptions = {}) {
  const [state, setState] = useState<TermLoadState>(() => ({
    term: requireLiveTerm ? null : FALLBACK_TERM_1_2,
    isInitialLoading: enabled,
    isReloading: false,
    error: null,
  }));
  const isMountedRef = useRef(true);
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    isMountedRef.current = true;
    onLoadedRef.current = onLoaded;
    return () => {
      isMountedRef.current = false;
    };
  }, [onLoaded]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void fetchTermIntoState(requireLiveTerm, () => active, setState, onLoadedRef);
    return () => {
      active = false;
    };
  }, [enabled, requireLiveTerm]);

  const reload = useCallback(() => {
    setState((prev) => ({
      term: requireLiveTerm ? null : prev.term,
      isInitialLoading: false,
      isReloading: true,
      error: null,
    }));
    return fetchTermIntoState(requireLiveTerm, () => isMountedRef.current, setState, onLoadedRef);
  }, [requireLiveTerm]);

  const isLoading =
    state.isReloading ||
    (enabled && state.isInitialLoading) ||
    (enabled && requireLiveTerm && state.term === null && state.error === null);

  return { term: state.term, isLoading, error: state.error, reload };
}
