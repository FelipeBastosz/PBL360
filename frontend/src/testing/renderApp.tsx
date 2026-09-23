import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthProvider';
import { ToastProvider } from '@/contexts/ToastProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import type { SessionResponse, UserResponse } from '@/types/auth';

type Entry = string | { pathname: string; search?: string; state?: unknown };

export function renderApp(entry: Entry = '/') {
  const user = userEvent.setup();
  const result = render(
    <ToastProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[entry]}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </ToastProvider>,
  );
  return { user, ...result };
}

export const studentUser: UserResponse = {
  id: 'b7a6f3c2-0c1d-4b8e-9f6a-1a2b3c4d5e6f',
  nome: 'Ana Souza',
  email: 'ana@discente.uefs.br',
  tipo: 'ALUNO',
  matricula: '20240001',
  fotoUrl: 'https://example.com/ana.png',
  ativo: true,
  criadoEm: '2026-09-01T10:00:00.000Z',
};

export function sessionFor(usuario: UserResponse, expiresInMs = 60 * 60 * 1000): SessionResponse {
  return {
    token: 'jwt-token',
    expiraEm: new Date(Date.now() + expiresInMs).toISOString(),
    usuario,
  };
}
