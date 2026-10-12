import type { SessionRole } from '../enums/session-role.enum';

export const SESSION_ROLE_REPOSITORY = Symbol('SESSION_ROLE_REPOSITORY');

export interface SessionRoleListItem {
  studentId: string;
  name: string;
  role: SessionRole;
  roleScore: number | null;
}

export interface SessionRoleRepository {
  list(sessionId: string): Promise<SessionRoleListItem[]>;
  assign(
    sessionId: string,
    roomId: string,
    studentId: string,
    role: SessionRole | null,
    roleScore: number | null,
    transfer: boolean,
  ): Promise<{ studentId: string; role: SessionRole | null; roleScore: number | null }>;
}
