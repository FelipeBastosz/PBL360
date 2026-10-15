import type { EntityManager } from 'typeorm';
import type { PerformanceTable } from '../../domain/entities/performance-table.entity';
import { assertOnlyWeightsChanged } from '../../domain/entities/performance-table-update-policy';
import {
  FIND_PERFORMANCE_TABLE_BY_ID_QUERY,
  FIND_PERFORMANCE_TABLE_USAGE_QUERY,
} from './performance-table.queries';
import {
  type PerformanceTableDetailRow,
  toPerformanceTableWithCriteria,
} from './performance-table-detail.mapper';

export async function assertPastSessionUpdateAllowed(
  manager: EntityManager,
  table: PerformanceTable,
): Promise<void> {
  await manager.query(
    'SELECT id FROM sessions WHERE performance_table_id = $1 ORDER BY id FOR UPDATE;',
    [table.id],
  );
  const [usage] = await manager.query<{ pastSessionCount: number }[]>(
    FIND_PERFORMANCE_TABLE_USAGE_QUERY,
    [table.id],
  );
  if (!usage?.pastSessionCount) return;
  const rows = await manager.query<PerformanceTableDetailRow[]>(
    FIND_PERFORMANCE_TABLE_BY_ID_QUERY,
    [table.id],
  );
  assertOnlyWeightsChanged(toPerformanceTableWithCriteria(rows), table);
}
