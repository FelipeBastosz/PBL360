import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useExpiryTimer } from '@/hooks/useExpiryTimer';
import { useToast } from '@/hooks/useToast';
import { setUnauthorizedHandler } from '@/services/api';
import { authService } from '@/services/auth.service';
import { sessionStore } from '@/services/sessionStore';
import type { LoginPayload, SessionResponse } from '@/types/auth';
import { AuthContext, SESSION_EXPIRED_MESSAGE, SESSION_SWITCHED_MESSAGE } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionResponse | null>(() => sessionStore.restore());
  const { notify } = useToast();

  const logout = useCallback(() => {
    sessionStore.clear();
    setSession(null);
  }, []);

  const expire = useCallback(() => {
    logout();
    notify({ tone: 'info', message: SESSION_EXPIRED_MESSAGE });
  }, [logout, notify]);

  // Keeps this tab on the account whose token the API client will actually send.
  const syncWithOtherTabs = useCallback(
    (stored: SessionResponse | null) => {
      setSession(stored);
      if (stored && stored.usuario.id !== session?.usuario.id) {
        notify({ tone: 'info', message: SESSION_SWITCHED_MESSAGE });
      }
    },
    [session?.usuario.id, notify],
  );

  useEffect(() => setUnauthorizedHandler(expire), [expire]);
  useEffect(() => sessionStore.subscribe(syncWithOtherTabs), [syncWithOtherTabs]);
  useExpiryTimer(session?.expiraEm, expire);

  const login = useCallback(async (payload: LoginPayload) => {
    const nextSession = await authService.login(payload);
    sessionStore.save(nextSession);
    setSession(nextSession);
    return nextSession.usuario;
  }, []);

  const value = useMemo(
    () => ({ user: session?.usuario ?? null, isAuthenticated: session !== null, login, logout }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
