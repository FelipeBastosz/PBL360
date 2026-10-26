import type { EntityManager } from 'typeorm';
import { ConflictError, NotFoundError } from '@/shared/errors/application.error';

export async function lockSessionPerformanceTable(
  manager: EntityManager,
  sessionId: string,
  exclusive = false,
): Promise<string> {
  const mode = exclusive ? 'UPDATE' : 'SHARE';
  const [table] = await manager.query<Array<{ id: string }>>(
    `SELECT pt.id FROM sessions s JOIN performance_tables pt ON pt.id = s.performance_table_id
      WHERE s.id = $1 AND pt.deleted_at IS NULL FOR ${mode} OF pt;`,
    [sessionId],
  );
  if (!table) throw new NotFoundError('A tabela da sessão não foi encontrada.');
  const [session] = await manager.query<Array<{ tableId: string }>>(
    'SELECT performance_table_id AS "tableId" FROM sessions WHERE id = $1;',
    [sessionId],
  );
  if (session?.tableId !== table.id)
    throw new ConflictError('A tabela da sessão mudou. Atualize a página e tente novamente.');
  return table.id;
}

export async function lockProblemPerformanceTables(
  manager: EntityManager,
  problemId: string,
  nextTableId: string,
): Promise<void> {
  await manager.query(
    `SELECT id FROM performance_tables WHERE id = $2 OR id IN (
       SELECT performance_table_id FROM sessions WHERE problem_id = $1
     ) ORDER BY id FOR SHARE;`,
    [problemId, nextTableId],
  );
}
