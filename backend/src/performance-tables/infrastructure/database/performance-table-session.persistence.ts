import type { EntityManager } from 'typeorm';
import { ConflictError } from '@/shared/errors/application.error';
import type { PerformanceTable } from '../../domain/entities/performance-table.entity';

const RECALCULATE_SESSION_EVALUATIONS = `
  WITH session_scores AS (
    SELECT e.id,
           e.session_id,
           e.student_id,
           e.session_score AS previous_score,
           e.applied_bonus AS role_score,
           SUM(COALESCE(ei.score, 0) * sec.weight) / NULLIF(SUM(sec.weight), 0) AS criteria_score,
           COALESCE((SELECT fc.weight FROM formulas f
                      JOIN formula_components fc ON fc.formula_id = f.id
                     WHERE f.session_id = e.session_id AND f.scope = 'SESSAO'
                       AND f.active = TRUE AND fc.type = 'CRITERIOS'), 70) AS criteria_weight,
           COALESCE((SELECT fc.weight FROM formulas f
                      JOIN formula_components fc ON fc.formula_id = f.id
                     WHERE f.session_id = e.session_id AND f.scope = 'SESSAO'
                       AND f.active = TRUE AND fc.type = 'PAPEL'), 30) AS role_weight
      FROM evaluations e
      JOIN sessions s ON s.id = e.session_id
      JOIN session_evaluation_configs cfg ON cfg.session_id = e.session_id
      JOIN session_evaluation_criteria sec ON sec.session_id = cfg.session_id
      LEFT JOIN evaluation_items ei
        ON ei.evaluation_id = e.id AND ei.criterion_id = sec.criterion_id
     WHERE s.performance_table_id = $1
       AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
     GROUP BY e.id
  ), weighted_scores AS (
    SELECT session_scores.*,
           ROUND(CASE WHEN role_score IS NULL THEN criteria_score
                      ELSE (criteria_score * criteria_weight + role_score * role_weight)
                           / NULLIF(criteria_weight + role_weight, 0)
                 END, 2) AS new_score
      FROM session_scores
  ), updated_evaluations AS (
    UPDATE evaluations e
       SET session_score = weighted_scores.new_score,
         calculation_version = 'WEIGHTED_SESSION_FORMULA_V3',
         updated_by = $2,
         updated_at = now()
      FROM weighted_scores
     WHERE e.id = weighted_scores.id
       AND e.session_score IS DISTINCT FROM weighted_scores.new_score
    RETURNING e.id
  )
  INSERT INTO grade_recalculation_history
    (evaluation_id, session_id, student_id, previous_score, new_score, reason_code, changed_by)
  SELECT weighted_scores.id, weighted_scores.session_id, weighted_scores.student_id,
         weighted_scores.previous_score, weighted_scores.new_score,
         'CRITERION_WEIGHTS_CHANGED', $2
    FROM weighted_scores
    JOIN updated_evaluations ON updated_evaluations.id = weighted_scores.id;
`;

export async function propagatePerformanceTableSessions(
  manager: EntityManager,
  table: PerformanceTable,
  changedBy: string,
): Promise<void> {
  await assertSubmittedItemsRemainValid(manager, table.id);
  await updateSnapshotTableNames(manager, table);
  await replaceSessionCriteria(manager, table.id);
  await removeObsoleteDraftItems(manager, table.id);
  await recalculateSessionEvaluations(manager, table.id, changedBy);
}

async function updateSnapshotTableNames(
  manager: EntityManager,
  table: PerformanceTable,
): Promise<void> {
  await manager.query(
    `UPDATE session_evaluation_configs cfg SET table_name = $2
      FROM sessions s
     WHERE s.id = cfg.session_id AND s.performance_table_id = $1;`,
    [table.id, table.name],
  );
}

async function replaceSessionCriteria(manager: EntityManager, tableId: string): Promise<void> {
  await manager.query(
    `DELETE FROM session_evaluation_criteria sec
    USING sessions s
    WHERE sec.session_id = s.id AND s.performance_table_id = $1;`,
    [tableId],
  );
  await manager.query(
    `INSERT INTO session_evaluation_criteria
       (session_id, criterion_id, name, description, weight, order_index)
     SELECT s.id, pc.id, pc.name, pc.description, pc.weight, pc.order_index
       FROM sessions s
       JOIN performance_criteria pc ON pc.performance_table_id = s.performance_table_id
      WHERE s.performance_table_id = $1 AND pc.deleted_at IS NULL
        AND EXISTS (SELECT 1 FROM session_evaluation_configs cfg WHERE cfg.session_id = s.id);`,
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

async function assertSubmittedItemsRemainValid(
  manager: EntityManager,
  tableId: string,
): Promise<void> {
  const [row] = await manager.query<{ exists: boolean }[]>(SUBMITTED_CRITERIA_MISMATCH, [tableId]);
  if (row?.exists)
    throw new ConflictError(
      'Não é possível propagar critérios adicionados ou removidos para avaliações já enviadas. Preserve os critérios dessas avaliações.',
    );
}

const SUBMITTED_CRITERIA_MISMATCH = `
  SELECT EXISTS (
    SELECT 1 FROM evaluations e JOIN sessions s ON s.id = e.session_id
     WHERE s.performance_table_id = $1 AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
       AND (EXISTS (
         SELECT 1 FROM performance_criteria pc WHERE pc.performance_table_id = $1 AND pc.deleted_at IS NULL
           AND NOT EXISTS (SELECT 1 FROM evaluation_items ei WHERE ei.evaluation_id = e.id AND ei.criterion_id = pc.id)
       ) OR EXISTS (
         SELECT 1 FROM evaluation_items ei WHERE ei.evaluation_id = e.id
           AND NOT EXISTS (SELECT 1 FROM performance_criteria pc WHERE pc.id = ei.criterion_id AND pc.performance_table_id = $1 AND pc.deleted_at IS NULL)
       ))
  ) AS exists;
`;

async function removeObsoleteDraftItems(manager: EntityManager, tableId: string): Promise<void> {
  await manager.query(
    `
    DELETE FROM evaluation_items ei USING evaluations e, sessions s
     WHERE ei.evaluation_id = e.id AND s.id = e.session_id
       AND s.performance_table_id = $1 AND e.type = 'TUTOR_SESSION' AND e.status = 'DRAFT'
       AND NOT EXISTS (SELECT 1 FROM session_evaluation_criteria sec
                        WHERE sec.session_id = e.session_id AND sec.criterion_id = ei.criterion_id);
  `,
    [tableId],
  );
}
