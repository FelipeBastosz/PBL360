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
  const adjustments = await readAdjustments(manager, evaluation?.id);
  const papel = await readStudentRole(manager, context.sessionId, studentId);
  return {
    config,
    evaluation: recalculateEvaluation(evaluation, config),
    adjustments,
    papel,
  };
}

async function readStudentRole(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
): Promise<string | null> {
  const [roleRow] = await manager.query<Array<{ role: string }>>(
    'SELECT role FROM session_roles WHERE session_id = $1 AND student_id = $2;',
    [sessionId, studentId],
  );
  return roleRow?.role ?? null;
}

async function readAdjustments(
  manager: EntityManager,
  evaluationId?: string,
): Promise<GradeAdjustment[]> {
  if (!evaluationId) return [];
  const rows = await manager.query<AdjustmentRow[]>(FIND_ADJUSTMENTS, [evaluationId]);
  return rows.map((row) => ({
    ...row,
    previousValue: Number(row.previousValue),
    newValue: Number(row.newValue),
  }));
}
