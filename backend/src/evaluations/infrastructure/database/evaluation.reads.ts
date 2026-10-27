import type { EntityManager } from 'typeorm';
import { recalculateEvaluation } from '../../domain/services/recalculate-evaluation';
import type { Evaluation } from '../../domain/entities/evaluation.entity';
import type { GradeAdjustment } from '../../domain/entities/grade-adjustment.entity';
import type {
  EvaluationContext,
  EvaluationDetail,
} from '../../domain/repositories/evaluation.repository';
import { toEvaluation, type EvaluationRow, type EvaluationItemRow } from './evaluation-row.mapper';
import { FIND_ADJUSTMENTS, FIND_EVALUATION, FIND_ITEMS } from './evaluation.queries';
import { readSessionConfig, readSessionTableConfig } from './session-evaluation-config.persistence';

interface AdjustmentRow extends Omit<GradeAdjustment, 'previousValue' | 'newValue'> {
  previousValue: string;
  newValue: string;
}

export async function readEvaluation(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
): Promise<Evaluation | null> {
  const [row] = await manager.query<EvaluationRow[]>(FIND_EVALUATION, [sessionId, studentId]);
  if (!row) return null;
  const items = await manager.query<EvaluationItemRow[]>(FIND_ITEMS, [row.id]);
  return toEvaluation(row, items);
}

export async function readEvaluationDetail(
  manager: EntityManager,
  context: EvaluationContext,
  studentId: string,
): Promise<EvaluationDetail> {
  const config =
    (await readSessionConfig(manager, context.sessionId)) ??
    (await readSessionTableConfig(manager, context.sessionId));
  const evaluation = await readEvaluation(manager, context.sessionId, studentId);
  const rows = evaluation
    ? await manager.query<AdjustmentRow[]>(FIND_ADJUSTMENTS, [evaluation.id])
    : [];
  const adjustments = rows.map((row) => ({
    ...row,
    previousValue: Number(row.previousValue),
    newValue: Number(row.newValue),
  }));
  return { config, evaluation: recalculateEvaluation(evaluation, config), adjustments };
}
