import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useExpiryTimer } from '@/hooks/useExpiryTimer';
import { useToast } from '@/hooks/useToast';
import { setUnauthorizedHandler } from '@/services/api';
import { authService } from '@/services/auth.service';
import { sessionStore } from '@/services/sessionStore';
import type { LoginPayload, SessionResponse, UserResponse } from '@/types/auth';
import { AuthContext, SESSION_EXPIRED_MESSAGE, SESSION_SWITCHED_MESSAGE } from './authContext';
import { clearUserPhotoCache } from '@/hooks/useUserPhoto';

function mergeSessionUser(
  prev: SessionResponse | null,
  updatedPartial: Partial<UserResponse>,
): SessionResponse | null {
  if (!prev) return null;
  const usuario = { ...prev.usuario, ...updatedPartial };
  sessionStore.saveUser(usuario);
  return { ...prev, usuario };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionResponse | null>(() => sessionStore.restore());
  const { notify } = useToast();

function restoreSessionWithTermsCheck(): SessionResponse | null {
  const restored = sessionStore.restore();
  if (restored) markLoginTermsCheck();
  return restored;
}

function useAuthActions(setSession: Dispatch<SetStateAction<SessionResponse | null>>) {
  const logout = useCallback(() => {
    clearSessionData();
    setSession(null);
  }, [setSession]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const nextSession = await authService.login(payload);
      sessionStore.save(nextSession);
      markLoginTermsCheck();
      setSession(nextSession);
      return nextSession.usuario;
    },
    [setSession],
  );

  const updateUser = useCallback(
    (updatedPartial: Partial<UserResponse>) => {
      setSession((prev) => {
        if (!prev) return null;
        const updatedUser = { ...prev.usuario, ...updatedPartial };
        sessionStore.saveUser(updatedUser);
        return { ...prev, usuario: updatedUser };
      });
    },
    [setSession],
  );

  return { logout, login, updateUser };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionResponse | null>(restoreSessionWithTermsCheck);
  const { notify } = useToast();
  const { logout, login, updateUser } = useAuthActions(setSession);

  const expire = useCallback(() => {
    logout();
    notify({ tone: 'info', message: SESSION_EXPIRED_MESSAGE });
  }, [logout, notify]);

  // Keeps this tab on the account whose token the API client will actually send.
  const syncWithOtherTabs = useCallback(
    (stored: SessionResponse | null) => {
      const switched = stored?.usuario.id !== session?.usuario.id;
      if (!stored || switched) clearUserPhotoCache();
      setSession(stored);
      if (stored && switched) notify({ tone: 'info', message: SESSION_SWITCHED_MESSAGE });
    },
    [session?.usuario.id, notify],
  );

  useEffect(() => setUnauthorizedHandler(expire), [expire]);
  useEffect(() => sessionStore.subscribe(syncWithOtherTabs), [syncWithOtherTabs]);
  useExpiryTimer(session?.expiraEm, expire);

  const login = useCallback(async (payload: LoginPayload) => {
    const nextSession = await authService.login(payload);
    clearUserPhotoCache();
    sessionStore.save(nextSession);
    setSession(nextSession);
    return nextSession.usuario;
  }, []);

  const updateUser = useCallback((updatedPartial: Partial<UserResponse>) => {
    setSession((prev) => mergeSessionUser(prev, updatedPartial));
  }, []);

  const value = useMemo(
    () => ({
      user: session?.usuario ?? null,
      isAuthenticated: !!session,
      login,
      logout,
      updateUser,
    }),
    [session, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
