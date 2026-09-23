import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import {
  ApiError,
  NETWORK_ERROR_MESSAGE,
  SERVER_ERROR_MESSAGE,
  TOO_MANY_REQUESTS_MESSAGE,
  UNKNOWN_ERROR_MESSAGE,
  getPendingVerification,
  toApiError,
} from './apiError';

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, response);
}

describe('toApiError', () => {
  it('keeps every validation message sent by the API', () => {
    const error = toApiError(
      axiosErrorWith(400, {
        statusCode: 400,
        message: ['Informe um e-mail válido.', 'A senha é obrigatória.'],
      }),
    );

    expect(error.status).toBe(400);
    expect(error.messages).toEqual(['Informe um e-mail válido.', 'A senha é obrigatória.']);
    expect(error.message).toBe('Informe um e-mail válido.');
  });

  it('wraps a single API message in a list', () => {
    const error = toApiError(
      axiosErrorWith(401, { statusCode: 401, message: 'E-mail ou senha inválidos.' }),
    );

    expect(error.messages).toEqual(['E-mail ou senha inválidos.']);
  });

  it('replaces the throttler message with a friendly one', () => {
    const error = toApiError(
      axiosErrorWith(429, { statusCode: 429, message: 'ThrottlerException' }),
    );

    expect(error.message).toBe(TOO_MANY_REQUESTS_MESSAGE);
  });

  it('hides server internals behind a generic message', () => {
    expect(toApiError(axiosErrorWith(500, { message: 'stack trace' })).message).toBe(
      SERVER_ERROR_MESSAGE,
    );
  });

  it('reports a network failure when there is no response', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'));

    expect(error.status).toBe(0);
    expect(error.message).toBe(NETWORK_ERROR_MESSAGE);
  });

  it('falls back to a generic message for anything else', () => {
    expect(toApiError(new Error('boom')).message).toBe(UNKNOWN_ERROR_MESSAGE);
    expect(toApiError(axiosErrorWith(404, 'Not Found')).message).toBe(UNKNOWN_ERROR_MESSAGE);
  });

  it('returns an ApiError untouched', () => {
    const original = new ApiError(400, ['x']);

    expect(toApiError(original)).toBe(original);
  });
});

describe('getPendingVerification', () => {
  it('extracts the pending account from a 403 login response', () => {
    const body = {
      statusCode: 403,
      message: 'Confirme o código enviado para o seu e-mail institucional para ativar a conta.',
      motivo: 'CONTA_NAO_VERIFICADA',
      usuarioId: 'b7a6f3c2-0c1d-4b8e-9f6a-1a2b3c4d5e6f',
      email: 'ana@discente.uefs.br',
    };

    expect(getPendingVerification(toApiError(axiosErrorWith(403, body)))).toEqual(body);
  });

  it('ignores any other error', () => {
    expect(getPendingVerification(new ApiError(403, ['Acesso negado.'], {}))).toBeNull();
    expect(getPendingVerification(new Error('x'))).toBeNull();
  });
});
