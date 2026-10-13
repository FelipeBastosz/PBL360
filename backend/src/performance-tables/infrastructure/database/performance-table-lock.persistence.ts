import type { EntityManager } from 'typeorm';

export async function lockPerformanceTableSessions(
  manager: EntityManager,
  tableId: string,
): Promise<void> {
  await manager.query(
    'SELECT id FROM sessions WHERE performance_table_id = $1 ORDER BY id FOR UPDATE;',
    [tableId],
  );
}
