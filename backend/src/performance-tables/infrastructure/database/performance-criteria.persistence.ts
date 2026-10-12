import type { EntityManager } from 'typeorm';
import type { PerformanceTable } from '../../domain/entities/performance-table.entity';
import type { PerformanceCriterion } from '../../domain/entities/performance-criterion.entity';
import { InvalidPerformanceTableError } from '../../domain/errors/invalid-performance-table.error';

export async function syncPerformanceCriteria(
  manager: EntityManager,
  table: PerformanceTable,
): Promise<void> {
  const retainedIds = table.criteria.flatMap((criterion) => (criterion.id ? [criterion.id] : []));
  await assertActiveCriteria(manager, table.id, retainedIds);
  await archiveOmittedCriteria(manager, table.id, retainedIds);

  await manager.query(
    `UPDATE performance_criteria SET order_index = -order_index
      WHERE performance_table_id = $1 AND deleted_at IS NULL;`,
    [table.id],
  );
  for (const criterion of table.criteria) {
    await persistCriterion(manager, table.id, criterion);
  }
}

async function assertActiveCriteria(
  manager: EntityManager,
  tableId: string,
  ids: string[],
): Promise<void> {
  const rows = await manager.query<{ id: string }[]>(
    `SELECT id FROM performance_criteria
      WHERE performance_table_id = $1 AND deleted_at IS NULL AND id = ANY($2::uuid[]);`,
    [tableId, ids],
  );
  if (rows.length !== ids.length) {
    throw new InvalidPerformanceTableError(
      'Um ou mais critérios não pertencem à configuração ativa desta tabela.',
    );
  }
}

async function archiveOmittedCriteria(
  manager: EntityManager,
  tableId: string,
  retainedIds: string[],
): Promise<void> {
  await manager.query(
    `UPDATE performance_criteria SET deleted_at = now(), updated_at = now()
      WHERE performance_table_id = $1 AND deleted_at IS NULL
        AND NOT (id = ANY($2::uuid[]));`,
    [tableId, retainedIds],
  );
}

async function persistCriterion(
  manager: EntityManager,
  tableId: string,
  criterion: PerformanceCriterion,
): Promise<void> {
  const values = criterionValues(tableId, criterion);
  if (criterion.id) {
    await manager.query(
      `UPDATE performance_criteria
          SET name = $2, description = $3, order_index = $4, weight = $5, max_score = $6, updated_at = now()
        WHERE performance_table_id = $1 AND id = $7 AND deleted_at IS NULL;`,
      [...values, criterion.id],
    );
  } else {
    await insertCriterion(manager, values);
  }
}

async function insertCriterion(
  manager: EntityManager,
  values: (string | number | null)[],
): Promise<void> {
  await manager.query(
    `INSERT INTO performance_criteria (performance_table_id, name, description, order_index, weight, max_score)
     VALUES ($1, $2, $3, $4, $5, $6);`,
    values,
  );
}

function criterionValues(
  tableId: string,
  criterion: PerformanceCriterion,
): (string | number | null)[] {
  return [
    tableId,
    criterion.name,
    criterion.description,
    criterion.orderIndex,
    criterion.weight,
    criterion.maxScore ?? 10,
  ];
}
