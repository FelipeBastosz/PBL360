import { afterEach, describe, expect, it } from 'vitest';
import type { SessionResponse } from '@/types/auth';
import { sessionStore } from './sessionStore';

function sessionExpiringIn(ms: number): SessionResponse {
  return {
    token: 'jwt-token',
    expiraEm: new Date(Date.now() + ms).toISOString(),
    usuario: {
      id: 'b7a6f3c2-0c1d-4b8e-9f6a-1a2b3c4d5e6f',
      nome: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      tipo: 'ALUNO',
      matricula: '20240001',
      possuiFoto: true,
      ativo: true,
      criadoEm: '2026-09-01T10:00:00.000Z',
    },
  };
}

afterEach(() => {
  localStorage.clear();
});

describe('sessionStore', () => {
  it('restores a saved session that has not expired', () => {
    const session = sessionExpiringIn(60_000);
    sessionStore.save(session);

    expect(sessionStore.restore()).toEqual(session);
    expect(sessionStore.getToken()).toBe('jwt-token');
  });

  it('discards an expired session on restore', () => {
    sessionStore.save(sessionExpiringIn(-1));

    expect(sessionStore.restore()).toBeNull();
    expect(sessionStore.getToken()).toBeNull();
  });

  it('discards corrupted data on restore', () => {
    localStorage.setItem('pbl360.session', '{not json');

    expect(sessionStore.restore()).toBeNull();
  });

  it('forgets the session on clear', () => {
    sessionStore.save(sessionExpiringIn(60_000));
    sessionStore.clear();

    expect(sessionStore.getToken()).toBeNull();
  });
});
