import type { EntityManager } from 'typeorm';
import {
  planDefaultSessionTables,
  type DefaultTableSession,
} from '../../domain/services/default-session-tables';

export async function reapplyDefaultSessionTables(
  manager: EntityManager,
  problemId: string,
): Promise<void> {
  const sessions = await lockProblemSessions(manager, problemId);
  const [evaluation] = await manager.query<Array<{ exists: boolean }>>(
    'SELECT EXISTS (SELECT 1 FROM evaluations WHERE problem_id = $1) AS exists;',
    [problemId],
  );
  for (const change of planDefaultSessionTables(sessions, evaluation?.exists ?? false)) {
    await manager.query('UPDATE sessions SET performance_table_id = $2 WHERE id = $1;', [
      change.sessionId,
      change.tableId,
    ]);
    await manager.query('DELETE FROM session_evaluation_configs WHERE session_id = $1;', [
      change.sessionId,
    ]);
  }
}

function lockProblemSessions(
  manager: EntityManager,
  problemId: string,
): Promise<DefaultTableSession[]> {
  return manager.query<DefaultTableSession[]>(
    `SELECT id, to_char(date, 'YYYY-MM-DD') AS date, order_index AS "orderIndex",
            performance_table_id AS "performanceTableId", uses_default_table AS "usesDefaultTable"
       FROM sessions WHERE problem_id = $1 ORDER BY date, order_index, id FOR UPDATE;`,
    [problemId],
  );
}
