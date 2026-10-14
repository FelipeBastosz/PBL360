import { NotFoundError } from '@/shared/errors/application.error';
import type { EntityManager } from 'typeorm';
import type { PerformanceTable } from '../../domain/entities/performance-table.entity';
import { syncPerformanceCriteria } from './performance-criteria.persistence';
import { assertPastSessionUpdateAllowed } from './performance-table-update.validation';
import { propagatePerformanceTableSessions } from './performance-table-session.persistence';
import { lockPerformanceTableSessions } from './performance-table-lock.persistence';
import { UPDATE_PERFORMANCE_TABLE_QUERY } from './performance-table.queries';

export async function persistTableUpdate(
  manager: EntityManager,
  table: PerformanceTable,
  propagate: boolean,
  changedBy: string,
): Promise<void> {
  await lockPerformanceTableSessions(manager, table.id);
  await lockTable(manager, table);
  await assertPastSessionUpdateAllowed(manager, table);
  await manager.query(UPDATE_PERFORMANCE_TABLE_QUERY, [table.id, table.name, table.description]);
  await syncPerformanceCriteria(manager, table);
  if (propagate) await propagatePerformanceTableSessions(manager, table, changedBy);
}

async function lockTable(manager: EntityManager, table: PerformanceTable): Promise<void> {
  const rows = await manager.query<{ id: string }[]>(
    `SELECT id FROM performance_tables
      WHERE id = $1 AND tutor_id = $2 AND deleted_at IS NULL FOR UPDATE;`,
    [table.id, table.tutorId],
  );
  if (rows.length === 0) throw new NotFoundError('Tabela de desempenho não encontrada.');
}
