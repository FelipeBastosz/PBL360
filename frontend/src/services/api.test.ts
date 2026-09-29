import { AxiosError, type AxiosAdapter, type AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, setUnauthorizedHandler } from './api';
import { ApiError } from './apiError';
import { sessionStore } from './sessionStore';

const originalAdapter = api.defaults.adapter;

function respondWith(status: number, data: unknown): AxiosAdapter {
  return async (config) => {
    const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse;
    if (status < 400) return response;
    throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, response);
  };
}

function saveSession(): void {
  sessionStore.save({
    token: 'jwt-token',
    expiraEm: new Date(Date.now() + 60_000).toISOString(),
    usuario: {
      id: '1',
      nome: 'Carlos Mendes',
      email: 'carlos@uefs.br',
      tipo: 'PROFESSOR',
      matricula: null,
      possuiFoto: false,
      ativo: true,
      criadoEm: '2026-09-01T10:00:00.000Z',
    },
  });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe('api client', () => {
  it('sends the stored token as a bearer header', async () => {
    saveSession();
    const adapter = vi.fn(respondWith(200, {}));
    api.defaults.adapter = adapter;

    await api.get('/salas');

    expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer jwt-token');
  });

  it('sends no authorization header without a session', async () => {
    const adapter = vi.fn(respondWith(200, {}));
    api.defaults.adapter = adapter;

    await api.get('/salas');

    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined();
  });

  it('rejects with an ApiError carrying the API message', async () => {
    api.defaults.adapter = respondWith(409, {
      statusCode: 409,
      message: 'Já existe uma conta cadastrada com este e-mail.',
    });

    await expect(api.post('/autenticacao/registro', {})).rejects.toMatchObject({
      status: 409,
      messages: ['Já existe uma conta cadastrada com este e-mail.'],
    });
  });

  it('notifies the unauthorized handler when an authenticated request gets a 401', async () => {
    saveSession();
    const onUnauthorized = vi.fn();
    const unsubscribe = setUnauthorizedHandler(onUnauthorized);
    api.defaults.adapter = respondWith(401, { statusCode: 401, message: 'Token expirado.' });

    await expect(api.get('/salas')).rejects.toBeInstanceOf(ApiError);

    expect(onUnauthorized).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it('does not treat a failed login as an expired session', async () => {
    const onUnauthorized = vi.fn();
    const unsubscribe = setUnauthorizedHandler(onUnauthorized);
    api.defaults.adapter = respondWith(401, {
      statusCode: 401,
      message: 'E-mail ou senha inválidos.',
    });

    await expect(api.post('/autenticacao/login', {})).rejects.toBeInstanceOf(ApiError);

    expect(onUnauthorized).not.toHaveBeenCalled();
    unsubscribe();
  });
});
