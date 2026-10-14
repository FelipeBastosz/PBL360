import type { EntityManager } from 'typeorm';
import type { SessionTableRow } from './session-table-configuration.persistence';

export async function replaceSessionSnapshot(
  manager: EntityManager,
  sessionId: string,
  table: SessionTableRow,
): Promise<void> {
  await manager.query(
    `UPDATE session_evaluation_configs
        SET performance_table_id = $2, table_name = $3
      WHERE session_id = $1;`,
    [sessionId, table.id, table.name],
  );
  await manager.query('DELETE FROM session_evaluation_criteria WHERE session_id = $1;', [
    sessionId,
  ]);
  await insertSnapshotCriteria(manager, sessionId, table.id);
}

async function insertSnapshotCriteria(
  manager: EntityManager,
  sessionId: string,
  tableId: string,
): Promise<void> {
  await manager.query(
    `INSERT INTO session_evaluation_criteria
       (session_id, criterion_id, name, description, weight, order_index)
     SELECT $1, pc.id, pc.name, pc.description, pc.weight, pc.order_index
       FROM performance_criteria pc
      WHERE pc.performance_table_id = $2 AND pc.deleted_at IS NULL
      ORDER BY pc.order_index, pc.created_at, pc.id;`,
    [sessionId, tableId],
  );
}

export async function removeObsoleteDraftItems(
  manager: EntityManager,
  sessionId: string,
): Promise<void> {
  await manager.query(
    `DELETE FROM evaluation_items ei
      USING evaluations e
      WHERE ei.evaluation_id = e.id AND e.session_id = $1 AND e.status = 'DRAFT'
        AND NOT EXISTS (
          SELECT 1 FROM session_evaluation_criteria sec
           WHERE sec.session_id = $1 AND sec.criterion_id = ei.criterion_id
        );`,
    [sessionId],
  );
}
