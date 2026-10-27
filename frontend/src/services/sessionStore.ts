import type { SessionResponse, UserResponse } from '@/types/auth';
import { isSessionExpired } from '@/utils/session';

const STORAGE_KEY = 'pbl360.session';

function isSession(value: unknown): value is SessionResponse {
  if (typeof value !== 'object' || value === null) return false;
  const session = value as Partial<SessionResponse>;
  return (
    typeof session.token === 'string' &&
    typeof session.expiraEm === 'string' &&
    typeof session.usuario === 'object' &&
    session.usuario !== null
  );
}

function read(): SessionResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export const sessionStore = {
  save(session: SessionResponse): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  restore(): SessionResponse | null {
    const session = read();
    if (session && !isSessionExpired(session.expiraEm)) return session;
    localStorage.removeItem(STORAGE_KEY);
    return null;
  },

  saveUser(usuario: UserResponse): void {
    const current = read();
    if (current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, usuario }));
    }
  },

  getToken(): string | null {
    return read()?.token ?? null;
  },
};
