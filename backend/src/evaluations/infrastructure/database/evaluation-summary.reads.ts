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
  adjustedScore?: string | number | null;
}

interface SummaryItemRow {
  evaluationId: string;
  criterionId: string;
  score: string;
}

const hasSubmittedTutorEvaluation = (row: SummaryRow) =>
  row.evaluationId !== null && row.status === EvaluationStatus.SUBMITTED;

const hasSubmittedOrAdjusted = (row: SummaryRow) =>
  row.status === EvaluationStatus.SUBMITTED ||
  (row.adjustedScore !== null && row.adjustedScore !== undefined);

export async function readEvaluationSummaries(
  manager: EntityManager,
  context: EvaluationContext,
): Promise<EvaluationSummary[]> {
  const rows = await manager.query<SummaryRow[]>(LIST_EVALUATIONS, [
    context.roomId,
    context.sessionId,
  ]);
  if (!rows.some(hasSubmittedOrAdjusted)) return rows.map(emptySummary);
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

function calculateScores(items: SummaryItemRow[], evaluationId: string | null) {
  return items
    .filter((item) => item.evaluationId === evaluationId)
    .map((item) => ({ criterionId: item.criterionId, score: Number(item.score) }));
}

function adjustedSummary(row: SummaryRow, summary: EvaluationSummary): EvaluationSummary | null {
  if (row.adjustedScore === null || row.adjustedScore === undefined) return null;
  return {
    ...summary,
    sessionScore: Number(row.adjustedScore),
    status: EvaluationStatus.SUBMITTED,
  };
}

function calculatedSummary(
  row: SummaryRow,
  items: SummaryItemRow[],
  config: SessionEvaluationConfig,
): EvaluationSummary {
  const summary = emptySummary(row);
  const adjusted = adjustedSummary(row, summary);
  if (adjusted) return adjusted;
  if (!hasSubmittedTutorEvaluation(row)) return summary;
  const scores = calculateScores(items, row.evaluationId);
  const bonus = row.appliedBonus === null ? null : Number(row.appliedBonus);
  summary.sessionScore = SessionGradeCalculator.calculate(
    scores,
    config.criteria,
    bonus,
    true,
    config.formula,
  );
  return summary;
}
