import type {
  AssignedSessionRole,
  AssignSessionRolePayload,
  AttendanceRecordPayload,
  RollCall,
  SessionRoleAssignment,
} from '@/types/session';
import { api } from './api';

const BASE = '/sessoes';

export const sessionService = {
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
