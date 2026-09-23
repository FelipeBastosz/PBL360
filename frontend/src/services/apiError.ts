import axios from 'axios';
import type { ErrorResponse, PendingVerificationResponse } from '@/types/auth';

export const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
export const TOO_MANY_REQUESTS_MESSAGE =
  'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
export const SERVER_ERROR_MESSAGE =
  'Ocorreu um erro inesperado no servidor. Tente novamente em instantes.';
export const UNKNOWN_ERROR_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente.';

export class ApiError extends Error {
  readonly status: number;
  readonly messages: string[];
  readonly body: unknown;

  constructor(status: number, messages: string[], body?: unknown) {
    super(messages[0] ?? UNKNOWN_ERROR_MESSAGE);
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages.length ? messages : [UNKNOWN_ERROR_MESSAGE];
    this.body = body;
  }
}

function isErrorResponse(body: unknown): body is ErrorResponse {
  return typeof body === 'object' && body !== null && 'message' in body;
}

function messagesFromBody(body: unknown): string[] {
  if (!isErrorResponse(body)) return [];
  return Array.isArray(body.message) ? body.message : [body.message];
}

function messagesForStatus(status: number, body: unknown): string[] {
  if (status === 429) return [TOO_MANY_REQUESTS_MESSAGE];
  if (status >= 500) return [SERVER_ERROR_MESSAGE];
  return messagesFromBody(body);
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error)) return new ApiError(0, [UNKNOWN_ERROR_MESSAGE]);
  if (!error.response) return new ApiError(0, [NETWORK_ERROR_MESSAGE]);
  const { status, data } = error.response;
  return new ApiError(status, messagesForStatus(status, data), data);
}

export function getPendingVerification(error: unknown): PendingVerificationResponse | null {
  if (!(error instanceof ApiError) || error.status !== 403) return null;
  const body = error.body as Partial<PendingVerificationResponse> | undefined;
  return body?.motivo === 'CONTA_NAO_VERIFICADA' ? (body as PendingVerificationResponse) : null;
}
