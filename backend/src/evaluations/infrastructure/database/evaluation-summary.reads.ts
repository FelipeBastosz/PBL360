import type { EntityManager } from 'typeorm';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type {
  EvaluationContext,
  EvaluationSummary,
} from '../../domain/repositories/evaluation.repository';
import type { SessionEvaluationConfig } from '../../domain/entities/session-evaluation-config.entity';
import { SessionGradeCalculator } from '../../domain/services/session-grade-calculator';
import { readSessionConfig, readSessionTableConfig } from './session-evaluation-config.persistence';
import { LIST_EVALUATIONS } from './evaluation.queries';

interface SummaryRow {
  studentId: string;
  name: string;
  status: EvaluationStatus | null;
  evaluationId: string | null;
  appliedBonus: string | null;
}

interface SummaryItemRow {
  evaluationId: string;
  criterionId: string;
  score: string;
}

export async function readEvaluationSummaries(
  manager: EntityManager,
  context: EvaluationContext,
): Promise<EvaluationSummary[]> {
  const rows = await manager.query<SummaryRow[]>(LIST_EVALUATIONS, [
    context.roomId,
    context.sessionId,
  ]);
  if (!rows.some((row) => row.status === EvaluationStatus.SUBMITTED)) return rows.map(emptySummary);
  const config =
    (await readSessionConfig(manager, context.sessionId)) ??
    (await readSessionTableConfig(manager, context.sessionId));
  const items = await manager.query<SummaryItemRow[]>(
    `SELECT ei.evaluation_id AS "evaluationId", ei.criterion_id AS "criterionId", ei.score
       FROM evaluation_items ei JOIN evaluations e ON e.id = ei.evaluation_id
      WHERE e.session_id = $1 AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED';`,
    [context.sessionId],
  );
  return rows.map((row) => calculatedSummary(row, items, config));
}

function emptySummary(row: SummaryRow): EvaluationSummary {
  return { studentId: row.studentId, name: row.name, status: row.status, sessionScore: null };
}

function calculatedSummary(
  row: SummaryRow,
  items: SummaryItemRow[],
  config: SessionEvaluationConfig,
): EvaluationSummary {
  const summary = emptySummary(row);
  if (row.status !== EvaluationStatus.SUBMITTED) return summary;
  const scores = items
    .filter((item) => item.evaluationId === row.evaluationId)
    .map((item) => ({ criterionId: item.criterionId, score: Number(item.score) }));
  summary.sessionScore = SessionGradeCalculator.calculate(
    scores,
    config.criteria,
    row.appliedBonus === null ? null : Number(row.appliedBonus),
    true,
    config.formula,
  );
  return summary;
}
