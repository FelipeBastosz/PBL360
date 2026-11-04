import type { EntityManager } from 'typeorm';
import { recalculateEvaluation } from '../../domain/services/recalculate-evaluation';
import { readSubmittedConfig } from './submitted-student-config.reads';
import type {
  EvaluationDetail,
  EvaluationContext,
  StudentEvaluationSummary,
} from '../../domain/repositories/evaluation.repository';
import { toEvaluation, type EvaluationItemRow, type EvaluationRow } from './evaluation-row.mapper';
import { FIND_ITEMS, FIND_SELF_EVALUATION } from './evaluation.queries';
import { STUDENT_EVALUATION_COUNTS } from './self-assessment.queries';
import { readSessionTableConfig, readSessionConfig } from './session-evaluation-config.persistence';

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
    tutorEvaluationSubmitted: row?.tutorEvaluationSubmitted ?? false,
    peerSubmitted: Number(row?.peerSubmitted ?? 0),
    peerTotal: Number(row?.peerTotal ?? 0),
  };
}

export async function readSelfAssessmentDetail(
  manager: EntityManager,
  context: EvaluationContext,
  studentId: string,
): Promise<EvaluationDetail> {
  const { sessionId } = context;
  const config = await readConfig(manager, sessionId);
  const [evaluation, roleInfo] = await Promise.all([
    readSelfEvaluation(manager, sessionId, studentId),
    readRoleInfo(manager, sessionId, studentId),
  ]);
  const effective = await readSubmittedConfig(manager, sessionId, evaluation, config);
  return {
    config: effective,
    evaluation: recalculateEvaluation(evaluation, effective, false),
    adjustments: [],
    papel: roleInfo.papel,
    roleScore: roleInfo.roleScore,
  };
}

async function readConfig(manager: EntityManager, sessionId: string) {
  return (
    (await readSessionConfig(manager, sessionId)) ??
    (await readSessionTableConfig(manager, sessionId))
  );
}

async function readRoleInfo(manager: EntityManager, sessionId: string, studentId: string) {
  const [row] = await manager.query<Array<{ role: string; role_score: string | null }>>(
    'SELECT role, role_score FROM session_roles WHERE session_id = $1 AND student_id = $2;',
    [sessionId, studentId],
  );
  return {
    papel: row?.role ?? null,
    roleScore: row?.role_score != null ? Number(row.role_score) : null,
  };
}

async function readSelfEvaluation(manager: EntityManager, sessionId: string, studentId: string) {
  const [row] = await manager.query<EvaluationRow[]>(FIND_SELF_EVALUATION, [sessionId, studentId]);
  const items = row ? await manager.query<EvaluationItemRow[]>(FIND_ITEMS, [row.id]) : [];
  return row ? toEvaluation(row, items) : null;
}
