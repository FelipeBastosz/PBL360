import { io, type Socket } from 'socket.io-client';
import { sessionStore } from './sessionStore';

export const POKER_EVENTS = [
  'poker.rodada_aberta',
  'poker.voto_registrado',
  'poker.revelada',
  'poker.decidida',
  'poker.rodada_cancelada',
  'poker.fila_atualizada',
  'poker.encerrado',
] as const;

export type PokerEventName = (typeof POKER_EVENTS)[number];

function socketOrigin(): string {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && /^https?:\/\//.test(apiUrl)) return new URL(apiUrl).origin;
  return window.location.origin;
}

export function connectPokerSocket(sessionId: string): Socket {
  return io(`${socketOrigin()}/poker`, {
    auth: { token: sessionStore.getToken(), sessaoId: sessionId },
    transports: ['websocket'],
    reconnectionDelayMax: 3000,
  });
}
