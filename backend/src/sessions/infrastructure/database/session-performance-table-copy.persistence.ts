import { NotFoundError } from '@/shared/errors/application.error';
import type { EntityManager } from 'typeorm';
import type { SessionTableRow } from './session-table-configuration.persistence';

export async function createSessionPerformanceTableCopy(
  manager: EntityManager,
  sourceTableId: string,
  roomId: string,
): Promise<SessionTableRow> {
  const [table] = await insertTableCopy(manager, sourceTableId, roomId);
  if (!table) throw new NotFoundError('A tabela de desempenho não foi encontrada.');
  await insertCriterionCopies(manager, sourceTableId, table.id);
  return table;
}

function insertTableCopy(manager: EntityManager, sourceTableId: string, roomId: string) {
  return manager.query<SessionTableRow[]>(
    `INSERT INTO performance_tables
       (tutor_id, room_id, name, description, is_default, source_table_id, is_session_copy)
     SELECT tutor_id, $2, name, description, FALSE, id, TRUE
       FROM performance_tables
      WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, name, is_default AS "isDefault";`,
    [sourceTableId, roomId],
  );
}

function insertCriterionCopies(
  manager: EntityManager,
  sourceTableId: string,
  copiedTableId: string,
) {
  return manager.query(
    `INSERT INTO performance_criteria
       (performance_table_id, name, description, order_index, weight, source_criterion_id)
     SELECT $2, name, description, order_index, weight, id
       FROM performance_criteria
      WHERE performance_table_id = $1 AND deleted_at IS NULL
      ORDER BY order_index, created_at, id;`,
    [sourceTableId, copiedTableId],
  );
}
