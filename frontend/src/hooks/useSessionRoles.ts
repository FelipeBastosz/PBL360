import { useCallback, useEffect, useState } from 'react';
import { toApiError } from '@/services/apiError';
import { sessionService } from '@/services/session.service';
import type { RoleConflictResponse, SessionRole, SessionRoleAssignment } from '@/types/session';

export type RoleAssignment = {
  studentId: string;
  role: SessionRole | null;
  score: number | null;
  transfer: boolean;
};

export type RoleAssignResult = { ok: true } | { ok: false; heldBy: string | null; message: string };

export function useSessionRoles(sessionId: string) {
  const [roles, setRoles] = useState<SessionRoleAssignment[]>([]);

  const reload = useCallback(
    () =>
      sessionService
        .listRoles(sessionId)
        .then(setRoles)
        .catch(() => setRoles([])),
    [sessionId],
  );

  useEffect(() => {
    const rolesPromise = sessionService.listRoles(sessionId);
    if (!rolesPromise || typeof rolesPromise.then !== 'function') return;

    rolesPromise.then(setRoles).catch(() => setRoles([]));
  }, [sessionId]);

  const assign = useCallback(
    async ({ studentId, role, score, transfer }: RoleAssignment): Promise<RoleAssignResult> => {
      try {
        await sessionService.assignRole(sessionId, studentId, {
          papel: role,
          notaAdicional: role ? score : null,
          transferir: transfer,
        });
        await reload();
        return { ok: true };
      } catch (caught) {
        const error = toApiError(caught);
        const heldBy = (error.body as RoleConflictResponse | undefined)?.ocupadoPor?.name ?? null;
        return { ok: false, heldBy: error.status === 409 ? heldBy : null, message: error.message };
      }
    },
    [reload, sessionId],
  );

  const roleOf = useCallback(
    (studentId: string) => roles.find((item) => item.alunoId === studentId) ?? null,
    [roles],
  );

  return { roles, roleOf, assign };
}
