import type { EntityManager } from 'typeorm';
import { requireFirstRow } from '@/shared/database/rows';
import type { SessionDeletionImpact } from '../../domain/repositories/session.repository';

export async function readSessionDeletionImpact(
  manager: EntityManager,
  sessionId: string,
): Promise<SessionDeletionImpact> {
  const rows = await manager.query<SessionDeletionImpact[]>(
    `SELECT
       (SELECT COUNT(*)::int FROM attendances WHERE session_id = $1) AS chamada,
       (SELECT COUNT(*)::int FROM session_roles WHERE session_id = $1) AS papeis,
       (SELECT COUNT(*)::int FROM observations WHERE session_id = $1) AS observacoes,
       (SELECT COUNT(*)::int FROM evaluations WHERE session_id = $1 OR config_session_id = $1) AS avaliacoes,
       (SELECT COUNT(*)::int FROM feedback WHERE sessao_id = $1) AS feedbacks;`,
    [sessionId],
  );
  return requireFirstRow(rows, 'Failed to read session deletion impact.');
}
