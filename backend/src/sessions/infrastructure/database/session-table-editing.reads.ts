import type { EntityManager } from 'typeorm';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { FIND_PERFORMANCE_TABLE_BY_ID_QUERY } from '@/performance-tables/infrastructure/database/performance-table.queries';
import {
  toPerformanceTableWithCriteria,
  type PerformanceTableDetailRow,
} from '@/performance-tables/infrastructure/database/performance-table-detail.mapper';
import type {
  SessionTableEditContext,
  TableSessionUsage,
} from '../../domain/repositories/session-table-editing.repository';

export async function readTableEditContext(
  manager: EntityManager,
  sessionId: string,
  tutorId: string,
): Promise<SessionTableEditContext> {
  const [current] = await manager.query<Array<{ tableId: string }>>(
    'SELECT performance_table_id AS "tableId" FROM sessions WHERE id = $1;',
    [sessionId],
  );
  if (!current) throw new NotFoundError('Sessão não encontrada.');
  const rows = await manager.query<PerformanceTableDetailRow[]>(
    FIND_PERFORMANCE_TABLE_BY_ID_QUERY,
    [current.tableId],
  );
  if (!rows.length) throw new NotFoundError('Tabela não encontrada.');
  const sessions = await readTableSessions(manager, current.tableId, tutorId);
  const session = sessions.find((item) => item.sessionId === sessionId);
  assertCurrentSessionAccess(session);
  return { table: toPerformanceTableWithCriteria(rows), session: session!, sessions };
}

function assertCurrentSessionAccess(session: TableSessionUsage | undefined): void {
  if (!session) throw new NotFoundError('Sessão não encontrada.');
  if (!session.canAccess)
    throw new ForbiddenError('Você não tem permissão para acessar esta sala.');
}

function readTableSessions(
  manager: EntityManager,
  tableId: string,
  tutorId: string,
): Promise<TableSessionUsage[]> {
  return manager.query<TableSessionUsage[]>(TABLE_SESSIONS, [tableId, tutorId]);
}

const TABLE_SESSIONS = `
  SELECT s.id AS "sessionId", s.title AS label, r.id AS "roomId",
         (s.date <= CURRENT_DATE OR EXISTS (
           SELECT 1 FROM evaluations e WHERE e.session_id = s.id
             AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
         )) AS "hasOccurred",
         (r.deleted_at IS NULL AND (r.tutor_id = $2 OR EXISTS (
           SELECT 1 FROM room_tutors rt WHERE rt.room_id = r.id AND rt.tutor_id = $2
         ))) AS "canAccess"
    FROM sessions s JOIN problems p ON p.id = s.problem_id JOIN rooms r ON r.id = p.room_id
   WHERE s.performance_table_id = $1 ORDER BY s.date, p.id, s.order_index, s.id;
`;
