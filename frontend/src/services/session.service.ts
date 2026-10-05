import type {
  CreateSessionPayload,
  Session,
  UpdateSessionPayload,
  SessionDeletionImpact,
} from '@/types/session';
import { api } from './api';

const sessionsOf = (roomId: string, problemId: string) =>
  `/salas/${roomId}/problemas/${problemId}/sessoes`;

export const sessionService = {
  list: (roomId: string, problemId: string) =>
    api.get<Session[]>(sessionsOf(roomId, problemId)).then((r) => r.data),

  getById: (roomId: string, problemId: string, sessionId: string) =>
    api.get<Session>(`${sessionsOf(roomId, problemId)}/${sessionId}`).then((r) => r.data),

  create: (roomId: string, problemId: string, payload: CreateSessionPayload) =>
    api.post<Session>(sessionsOf(roomId, problemId), payload).then((r) => r.data),

  update: (roomId: string, problemId: string, sessionId: string, payload: UpdateSessionPayload) =>
    api.put<Session>(`${sessionsOf(roomId, problemId)}/${sessionId}`, payload).then((r) => r.data),

  getDeletionImpact: (roomId: string, problemId: string, sessionId: string) =>
    api
      .get<SessionDeletionImpact>(`${sessionsOf(roomId, problemId)}/${sessionId}/impacto-exclusao`)
      .then((r) => r.data),

  remove: (roomId: string, problemId: string, sessionId: string) =>
    api.delete<void>(`${sessionsOf(roomId, problemId)}/${sessionId}`).then(() => undefined),
};
