import axios, { type InternalAxiosRequestConfig } from 'axios';
import { toApiError } from './apiError';
import { sessionStore } from './sessionStore';

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

export function setUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

function attachToken(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = sessionStore.getToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
}

function sentToken(error: unknown): boolean {
  return axios.isAxiosError(error) && Boolean(error.config?.headers?.Authorization);
}

function rejectAsApiError(error: unknown): Promise<never> {
  const apiError = toApiError(error);
  if (apiError.status === 401 && sentToken(error)) unauthorizedHandler?.();
  return Promise.reject(apiError);
}

api.interceptors.request.use(attachToken);
api.interceptors.response.use((response) => response, rejectAsApiError);
