import type { EntityManager } from 'typeorm';
import { lockSessionPerformanceTable } from '@/sessions/infrastructure/database/session-table-lock.persistence';
import { ConflictError, LockedError, NotFoundError } from '@/shared/errors/application.error';
import { validateEvaluationRules } from '../../application/services/evaluation-rule-validation';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type {
  EvaluationDetail,
  SelfAssessmentWrite,
} from '../../domain/repositories/evaluation.repository';
import { type ScoringCriterion, EvaluationRules } from '../../domain/services/evaluation-rules';
import {
  SessionGradeCalculator,
  SESSION_CALCULATION_VERSION,
} from '../../domain/services/session-grade-calculator';
import { FIND_SELF_EVALUATION } from './evaluation.queries';
import { freezeSessionConfig } from './session-evaluation-config.persistence';
import { readSelfAssessmentDetail } from './self-assessment.reads';
import {
  FIND_SELF_ATTENDANCE,
  FIND_SELF_RELEASE,
  INSERT_SELF_EVALUATION,
  UPDATE_SELF_DRAFT,
  UPDATE_SELF_SUBMISSION,
} from './self-assessment.queries';

interface ReleaseRow {
  released: boolean;
  deadline: Date | null;
}

export async function recordSelfAssessment(
  manager: EntityManager,
  input: SelfAssessmentWrite,
): Promise<EvaluationDetail> {
  return manager.transaction((tx) => executeSelfAssessment(tx, input));
}

async function executeSelfAssessment(
  tx: EntityManager,
  input: SelfAssessmentWrite,
): Promise<EvaluationDetail> {
  await lockSessionPerformanceTable(tx, input.context.sessionId);
  await assertSelfAssessmentOpen(tx, input);
  const evaluationId = await prepareSelfAssessment(tx, input);
  await persistSelfAssessment(tx, evaluationId, input);
  return readSelfAssessmentDetail(tx, input.context, input.studentId);
}

async function prepareSelfAssessment(
  tx: EntityManager,
  input: SelfAssessmentWrite,
): Promise<string> {
  const config = await freezeSessionConfig(tx, input.context.sessionId, input.studentId);
  const existing = await findExisting(tx, input);
  assertNotSubmitted(existing);
  validateItems(input, config.criteria);
  return existing?.id ?? insertSelfAssessment(tx, input, config.tableId);
}

function assertNotSubmitted(existing: { status: EvaluationStatus } | null): void {
  if (existing?.status === EvaluationStatus.SUBMITTED) {
    throw new ConflictError('A autoavaliação já foi enviada e não pode ser alterada.');
  }
}

function validateItems(input: SelfAssessmentWrite, criterionIds: ScoringCriterion[]): void {
  validateEvaluationRules(() =>
    EvaluationRules.assertValidItems(input.items, criterionIds, input.submit),
  );
}

async function persistSelfAssessment(
  tx: EntityManager,
  evaluationId: string,
  input: SelfAssessmentWrite,
): Promise<void> {
  await replaceSelfItems(tx, evaluationId, input);
  await updateSelfStatus(tx, evaluationId, input);
}

async function assertSelfAssessmentOpen(
  tx: EntityManager,
  input: SelfAssessmentWrite,
): Promise<void> {
  const [release] = await tx.query<ReleaseRow[]>(FIND_SELF_RELEASE, [input.context.sessionId]);
  if (!release) throw new NotFoundError('Sessão não encontrada.');
  if (!release.released) throw new LockedError('A autoavaliação não está liberada.');
  if (release.deadline && new Date(release.deadline) <= new Date()) {
    throw new LockedError('O prazo para a autoavaliação expirou.');
  }
  const rows = await tx.query<unknown[]>(FIND_SELF_ATTENDANCE, [
    input.context.sessionId,
    input.studentId,
  ]);
  if (rows.length === 0) {
    throw new LockedError('Apenas alunos presentes ou atrasados podem se autoavaliar.');
  }
}

async function findExisting(
  tx: EntityManager,
  input: SelfAssessmentWrite,
): Promise<{ id: string; status: EvaluationStatus } | null> {
  const [row] = await tx.query<Array<{ id: string; status: EvaluationStatus }>>(
    `SELECT id, status FROM evaluations
      WHERE session_id = $1 AND student_id = $2 AND type = 'SELF_ASSESSMENT' FOR UPDATE;`,
    [input.context.sessionId, input.studentId],
  );
  return row ?? null;
}

async function insertSelfAssessment(
  tx: EntityManager,
  input: SelfAssessmentWrite,
  tableId: string,
): Promise<string> {
  const [inserted] = await tx.query<Array<{ id: string }>>(INSERT_SELF_EVALUATION, [
    input.studentId,
    input.context.problemId,
    input.context.sessionId,
    tableId,
  ]);
  if (inserted) return inserted.id;
  const [row] = await tx.query<Array<{ id: string }>>(FIND_SELF_EVALUATION, [
    input.context.sessionId,
    input.studentId,
  ]);
  return row!.id;
}

async function replaceSelfItems(
  tx: EntityManager,
  evaluationId: string,
  input: SelfAssessmentWrite,
): Promise<void> {
  await tx.query('DELETE FROM evaluation_items WHERE evaluation_id = $1;', [evaluationId]);
  for (const item of input.items) {
    await tx.query(
      'INSERT INTO evaluation_items (evaluation_id, criterion_id, score) VALUES ($1, $2, $3);',
      [evaluationId, item.criterionId, item.score],
    );
  }
}

async function updateSelfStatus(
  tx: EntityManager,
  evaluationId: string,
  input: SelfAssessmentWrite,
): Promise<void> {
  const now = new Date();
  if (!input.submit) {
    await tx.query(UPDATE_SELF_DRAFT, [input.studentId, now, evaluationId]);
    return;
  }
  await submitSelfAssessment(tx, evaluationId, input, now);
}

async function submitSelfAssessment(
  tx: EntityManager,
  evaluationId: string,
  input: SelfAssessmentWrite,
  now: Date,
): Promise<void> {
  const detail = await readSelfAssessmentDetail(tx, input.context, input.studentId);
  const notaCargo = input.notaCargo ?? null;
  const score = calculateSelfScore(input, detail.config, notaCargo);
  await tx.query(UPDATE_SELF_SUBMISSION, [
    now,
    score,
    notaCargo,
    SESSION_CALCULATION_VERSION,
    input.studentId,
    evaluationId,
  ]);
}

function calculateSelfScore(
  input: SelfAssessmentWrite,
  config: Awaited<ReturnType<typeof readSelfAssessmentDetail>>['config'],
  notaCargo: number | null,
): number {
  return SessionGradeCalculator.calculate(
    input.items,
    config.criteria,
    notaCargo,
    notaCargo !== null,
    config.formula ?? { criteriaWeight: 70, roleWeight: 30 },
  );
}
