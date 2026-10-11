import type { EntityManager } from 'typeorm';
import type { PerformanceTable } from '../../domain/entities/performance-table.entity';

const RECALCULATE_SESSION_EVALUATIONS = `
  WITH weighted_scores AS (
    SELECT e.id,
           SUM(COALESCE(ei.score, 0) * sec.weight) / NULLIF(SUM(sec.weight), 0) AS simple_score
      FROM evaluations e
      JOIN session_evaluation_configs cfg ON cfg.session_id = e.session_id
      JOIN session_evaluation_criteria sec ON sec.session_id = cfg.session_id
      LEFT JOIN evaluation_items ei
        ON ei.evaluation_id = e.id AND ei.criterion_id = sec.criterion_id
     WHERE cfg.performance_table_id = $1
       AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
     GROUP BY e.id
  )
  UPDATE evaluations e
     SET session_score = ROUND((weighted_scores.simple_score * 7 + COALESCE(e.applied_bonus, 0) * 10 * 3) / 10, 2),
         calculation_version = 'WEIGHTED_CRITERIA_CARGO_70_30_V2',
         updated_by = $2,
         updated_at = now()
    FROM weighted_scores
   WHERE e.id = weighted_scores.id;
`;

export async function propagatePerformanceTableSessions(
  manager: EntityManager,
  table: PerformanceTable,
): Promise<void> {
  await updateSnapshotTableNames(manager, table);
  await replaceSessionCriteria(manager, table.id);
  await recalculateSessionEvaluations(manager, table.id, table.tutorId);
}

async function updateSnapshotTableNames(
  manager: EntityManager,
  table: PerformanceTable,
): Promise<void> {
  await manager.query(
    'UPDATE session_evaluation_configs SET table_name = $2 WHERE performance_table_id = $1;',
    [table.id, table.name],
  );
}

async function replaceSessionCriteria(manager: EntityManager, tableId: string): Promise<void> {
  await manager.query(
    `DELETE FROM session_evaluation_criteria sec
      USING session_evaluation_configs cfg
      WHERE sec.session_id = cfg.session_id AND cfg.performance_table_id = $1;`,
    [tableId],
  );
  await manager.query(
    `INSERT INTO session_evaluation_criteria
       (session_id, criterion_id, name, description, weight, order_index)
     SELECT cfg.session_id, pc.id, pc.name, pc.description, pc.weight, pc.order_index
       FROM session_evaluation_configs cfg
       JOIN performance_criteria pc ON pc.performance_table_id = cfg.performance_table_id
      WHERE cfg.performance_table_id = $1 AND pc.deleted_at IS NULL;`,
    [tableId],
  );
}

async function recalculateSessionEvaluations(
  manager: EntityManager,
  tableId: string,
  tutorId: string,
): Promise<void> {
  await manager.query(RECALCULATE_SESSION_EVALUATIONS, [tableId, tutorId]);
}
