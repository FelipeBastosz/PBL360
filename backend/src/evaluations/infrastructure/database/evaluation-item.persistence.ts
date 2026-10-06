import type { EntityManager } from 'typeorm';
import type { CriterionScore } from '../../domain/services/evaluation-rules';
import type { ScoreChange } from '../../domain/entities/grade-adjustment.entity';

export async function persistEvaluationItems(
  manager: EntityManager,
  evaluationId: string,
  items: CriterionScore[],
): Promise<void> {
  await manager.query(
    'DELETE FROM evaluation_items WHERE evaluation_id = $1 AND NOT (criterion_id = ANY($2::uuid[]));',
    [evaluationId, items.map((item) => item.criterionId)],
  );
  for (const item of items) {
    await manager.query(
      `INSERT INTO evaluation_items (evaluation_id, criterion_id, score) VALUES ($1, $2, $3)
       ON CONFLICT (evaluation_id, criterion_id) DO UPDATE SET score = EXCLUDED.score;`,
      [evaluationId, item.criterionId, item.score],
    );
  }
}

export async function persistAdjustments(
  manager: EntityManager,
  changes: ScoreChange[],
  authorId: string,
  justification: string,
  at: Date,
): Promise<void> {
  for (const change of changes) {
    await manager.query(
      `INSERT INTO grade_adjustments (evaluation_item_id, previous_value, new_value, justification, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6);`,
      [change.itemId, change.previousValue, change.newValue, justification.trim(), authorId, at],
    );
  }
}
