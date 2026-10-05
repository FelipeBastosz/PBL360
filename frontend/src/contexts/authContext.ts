import { createContext } from 'react';
import type { LoginPayload, UserResponse } from '@/types/auth';

export type AuthContextValue = {
  user: UserResponse | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<UserResponse>;
  logout: () => void;
};

export const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente para continuar.';

export const SESSION_SWITCHED_MESSAGE =
  'Você entrou com outra conta em outra aba. Esta aba agora usa essa conta.';

export const AuthContext = createContext<AuthContextValue | null>(null);
