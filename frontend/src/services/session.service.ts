import type {
  AssignSessionRolePayload,
  AssignedSessionRole,
  AttendanceRecordPayload,
  CreateSessionPayload,
  RollCall,
  Session,
  SessionDeletionImpact,
  SessionRoleAssignment,
  UpdateSessionPayload,
} from '@/types/session';
import { api } from './api';

const BASE = '/sessoes';

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

  getRollCall: (sessionId: string) =>
    api.get<RollCall>(`${BASE}/${sessionId}/chamada`).then((r) => r.data),

  saveRollCall: (sessionId: string, registros: AttendanceRecordPayload[]) =>
    api.put<RollCall>(`${BASE}/${sessionId}/chamada`, { registros }).then((r) => r.data),

  listRoles: (sessionId: string) =>
    api.get<SessionRoleAssignment[]>(`${BASE}/${sessionId}/papeis`).then((r) => r.data),

  assignRole: (sessionId: string, studentId: string, payload: AssignSessionRolePayload) =>
    api
      .put<AssignedSessionRole>(`${BASE}/${sessionId}/papeis/${studentId}`, payload)
      .then((r) => r.data),
};
