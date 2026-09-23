import { createContext } from 'react';
import type { LoginPayload, UserResponse } from '@/types/auth';

export type AuthContextValue = {
  user: UserResponse | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<UserResponse>;
  logout: () => void;
};

export const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente para continuar.';

export const AuthContext = createContext<AuthContextValue | null>(null);
