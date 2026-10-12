import type { EntityManager } from 'typeorm';
import type {
  EvaluationDetail,
  EvaluationContext,
  StudentEvaluationSummary,
} from '../../domain/repositories/evaluation.repository';
import { toEvaluation, type EvaluationItemRow, type EvaluationRow } from './evaluation-row.mapper';
import { FIND_ITEMS, FIND_SELF_EVALUATION } from './evaluation.queries';
import { STUDENT_EVALUATION_COUNTS } from './self-assessment.queries';
import { readProblemConfig, readSessionConfig } from './session-evaluation-config.persistence';

interface CountRow extends Omit<StudentEvaluationSummary, 'peerSubmitted' | 'peerTotal'> {
  peerSubmitted: number | string;
  peerTotal: number | string;
}

export async function getStudentEvaluationSummary(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
): Promise<StudentEvaluationSummary> {
  const [row] = await manager.query<CountRow[]>(STUDENT_EVALUATION_COUNTS, [sessionId, studentId]);
  return {
    participating: row?.participating ?? false,
    peerSubmitted: Number(row?.peerSubmitted ?? 0),
    peerTotal: Number(row?.peerTotal ?? 0),
  };
}

export async function readSelfAssessmentDetail(
  manager: EntityManager,
  context: EvaluationContext,
  studentId: string,
): Promise<EvaluationDetail> {
  const config =
    (await readSessionConfig(manager, context.sessionId)) ??
    (await readProblemConfig(manager, context.problemId));
  const [row] = await manager.query<EvaluationRow[]>(FIND_SELF_EVALUATION, [
    context.sessionId,
    studentId,
  ]);
  const items = row ? await manager.query<EvaluationItemRow[]>(FIND_ITEMS, [row.id]) : [];
  return { config, evaluation: row ? toEvaluation(row, items) : null, adjustments: [] };
}
