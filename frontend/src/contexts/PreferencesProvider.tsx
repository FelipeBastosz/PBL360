import {
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { preferencesService } from '@/services/preferences.service';
import { preferencesStore } from '@/services/preferencesStore';
import type {
  ThemePreference,
  UpdateUserPreferencesPayload,
  UserPreferences,
} from '@/types/preferences';
import { applyPreferencesToDom, resetPreferencesDom } from '@/utils/themeDom';
import {
  DEFAULT_SYSTEM_COLOR,
  DEFAULT_USER_PREFERENCES,
  normalizeHexColor,
  normalizeThemePreference,
  normalizeUserPreferences,
} from '@/utils/themePalette';
import { PREFERENCES_SAVE_ERROR_MESSAGE, PreferencesContext } from './preferencesContext';

type SyncStateRef = MutableRefObject<{
  activeUserId: string | null;
  confirmed: UserPreferences;
  current: UserPreferences;
  mutationSeq: number;
}>;

type StateSetters = {
  setPreferences: Dispatch<SetStateAction<UserPreferences>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
};

function readInitialPreferences(userId: string | null): UserPreferences {
  if (!userId) return DEFAULT_USER_PREFERENCES;
  return preferencesStore.read(userId) ?? DEFAULT_USER_PREFERENCES;
}

function applyConfirmedPreferences(
  userId: string,
  next: UserPreferences,
  stateRef: SyncStateRef,
  setPreferences: Dispatch<SetStateAction<UserPreferences>>,
) {
  stateRef.current.confirmed = next;
  stateRef.current.current = next;
  setPreferences(next);
  preferencesStore.save(userId, next);
  applyPreferencesToDom(next);
}

function resetAccountState(stateRef: SyncStateRef, setters: StateSetters) {
  preferencesStore.clear();
  stateRef.current.confirmed = DEFAULT_USER_PREFERENCES;
  stateRef.current.current = DEFAULT_USER_PREFERENCES;
  setters.setPreferences(DEFAULT_USER_PREFERENCES);
  setters.setIsLoading(false);
  resetPreferencesDom();
}

function useSyncAccountPreferences(
  userId: string | null,
  stateRef: SyncStateRef,
  setters: StateSetters,
) {
  const { setPreferences, setIsLoading, setIsSaving, setErrorMessage } = setters;

  useEffect(() => {
    stateRef.current.activeUserId = userId;
    stateRef.current.mutationSeq += 1;
    const startSeq = stateRef.current.mutationSeq;
    setErrorMessage(null);
    setIsSaving(false);

    if (!userId) {
      resetAccountState(stateRef, { setPreferences, setIsLoading, setIsSaving, setErrorMessage });
      return;
    }

    const initial = readInitialPreferences(userId);
    stateRef.current.confirmed = initial;
    stateRef.current.current = initial;
    setPreferences(initial);
    applyPreferencesToDom(initial);
    setIsLoading(true);

    let cancelled = false;
    void preferencesService
      .getMyPreferences()
      .then((fetched) => {
        if (cancelled || stateRef.current.activeUserId !== userId) return;
        if (stateRef.current.mutationSeq !== startSeq) return;
        const normalized = normalizeUserPreferences(fetched);
        applyConfirmedPreferences(userId, normalized, stateRef, setPreferences);
      })
      .catch(() => {
        // Keep the user-bound cache or defaults if the initial fetch fails.
      })
      .finally(() => {
        if (!cancelled && stateRef.current.activeUserId === userId) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, stateRef, setPreferences, setIsLoading, setIsSaving, setErrorMessage]);
}

async function persistUpdate(params: {
  userId: string;
  payload: UpdateUserPreferencesPayload;
  optimistic: UserPreferences;
  stateRef: SyncStateRef;
  setPreferences: Dispatch<SetStateAction<UserPreferences>>;
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
}): Promise<boolean> {
  const { userId, payload, optimistic, stateRef, setPreferences, setIsSaving, setErrorMessage } =
    params;
  stateRef.current.mutationSeq += 1;
  const requestSeq = stateRef.current.mutationSeq;

  stateRef.current.current = optimistic;
  setPreferences(optimistic);
  setErrorMessage(null);
  setIsSaving(true);
  applyPreferencesToDom(optimistic);

  try {
    const saved = normalizeUserPreferences(await preferencesService.updateMyPreferences(payload));
    if (stateRef.current.activeUserId !== userId || stateRef.current.mutationSeq !== requestSeq) {
      return false;
    }
    applyConfirmedPreferences(userId, saved, stateRef, setPreferences);
    setIsSaving(false);
    return true;
  } catch {
    if (stateRef.current.activeUserId !== userId || stateRef.current.mutationSeq !== requestSeq) {
      return false;
    }
    const previous = stateRef.current.confirmed;
    applyConfirmedPreferences(userId, previous, stateRef, setPreferences);
    setErrorMessage(PREFERENCES_SAVE_ERROR_MESSAGE);
    setIsSaving(false);
    return false;
  }
}

function usePreferencesActions(params: {
  userId: string | null;
  isSaving: boolean;
  stateRef: SyncStateRef;
  setPreferences: Dispatch<SetStateAction<UserPreferences>>;
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
}) {
  const { userId, isSaving, stateRef, setPreferences, setIsSaving, setErrorMessage } = params;

  const setTheme = useCallback(
    async (theme: ThemePreference) => {
      if (!userId) return false;
      const nextTheme = normalizeThemePreference(theme);
      if (stateRef.current.current.tema === nextTheme && !isSaving) return true;
      return persistUpdate({
        userId,
        payload: { tema: nextTheme },
        optimistic: { ...stateRef.current.current, tema: nextTheme },
        stateRef,
        setPreferences,
        setIsSaving,
        setErrorMessage,
      });
    },
    [userId, isSaving, stateRef, setPreferences, setIsSaving, setErrorMessage],
  );

  const setColor = useCallback(
    async (hex: string) => {
      if (!userId) return false;
      const nextColor = normalizeHexColor(hex);
      if (stateRef.current.current.cor === nextColor && !isSaving) return true;
      return persistUpdate({
        userId,
        payload: { cor: nextColor },
        optimistic: { ...stateRef.current.current, cor: nextColor },
        stateRef,
        setPreferences,
        setIsSaving,
        setErrorMessage,
      });
    },
    [userId, isSaving, stateRef, setPreferences, setIsSaving, setErrorMessage],
  );

  const resetColor = useCallback(() => setColor(DEFAULT_SYSTEM_COLOR), [setColor]);
  const clearError = useCallback(() => setErrorMessage(null), [setErrorMessage]);

  return { setTheme, setColor, resetColor, clearError };
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    readInitialPreferences(userId),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stateRef = useRef({
    activeUserId: userId,
    confirmed: preferences,
    current: preferences,
    mutationSeq: 0,
  });

  useSyncAccountPreferences(userId, stateRef, {
    setPreferences,
    setIsLoading,
    setIsSaving,
    setErrorMessage,
  });

  const { setTheme, setColor, resetColor, clearError } = usePreferencesActions({
    userId,
    isSaving,
    stateRef,
    setPreferences,
    setIsSaving,
    setErrorMessage,
  });

  const value = useMemo(
    () => ({
      preferences,
      isLoading,
      isSaving,
      errorMessage,
      setTheme,
      setColor,
      resetColor,
      clearError,
    }),
    [preferences, isLoading, isSaving, errorMessage, setTheme, setColor, resetColor, clearError],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
