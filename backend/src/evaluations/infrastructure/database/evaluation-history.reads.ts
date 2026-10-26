import type { EntityManager } from 'typeorm';
import {
  FIND_PARTICIPATING_STUDENTS_QUERY,
  FIND_RECEIVED_PEER_EVALUATIONS_QUERY,
  FIND_SELF_ADJUSTMENTS_DETAIL_QUERY,
  FIND_SESSION_ADJUSTMENTS_QUERY,
  FIND_SESSION_PEER_EVALUATIONS_QUERY,
  FIND_SESSION_SELF_EVALUATIONS_QUERY,
  FIND_SESSION_TIMINGS_QUERY,
  FIND_SESSION_TUTOR_SCORES_QUERY,
  FIND_STUDENT_PARTICIPANT_QUERY,
  FIND_STUDENT_SELF_EVALUATION_QUERY,
  FIND_STUDENT_TUTOR_SCORES_QUERY,
  IS_STUDENT_PARTICIPATING_QUERY,
} from './evaluation-history.queries';
import type {
  ComparisonPeerItemRow,
  ComparisonPeerRow,
  EvaluationItemRow,
  SelfAdjustmentDetailRow,
  SelfAdjustmentRow,
  SelfEvaluationRow,
  SessionTimingRow,
  StudentRow,
  TutorScoreRow,
} from './evaluation-history.types';
import { readSessionConfig, readSessionTableConfig } from './session-evaluation-config.persistence';

export async function readParticipatingStatus(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
): Promise<boolean> {
  const [row] = await manager.query<Array<{ exists: boolean }>>(IS_STUDENT_PARTICIPATING_QUERY, [
    sessionId,
    studentId,
  ]);
  return row?.exists ?? false;
}

export function readParticipatingStudents(
  manager: EntityManager,
  sessionId: string,
): Promise<StudentRow[]> {
  return manager.query<StudentRow[]>(FIND_PARTICIPATING_STUDENTS_QUERY, [sessionId]);
}

export async function readHistoryConfig(manager: EntityManager, sessionId: string) {
  const config = await readSessionConfig(manager, sessionId);
  if (config) return config;
  return readSessionTableConfig(manager, sessionId);
}

export function readSessionSelfEvaluations(
  manager: EntityManager,
  sessionId: string,
): Promise<SelfEvaluationRow[]> {
  return manager.query<SelfEvaluationRow[]>(FIND_SESSION_SELF_EVALUATIONS_QUERY, [sessionId]);
}

export function readSessionAdjustments(
  manager: EntityManager,
  sessionId: string,
): Promise<SelfAdjustmentRow[]> {
  return manager.query<SelfAdjustmentRow[]>(FIND_SESSION_ADJUSTMENTS_QUERY, [sessionId]);
}

export function readSessionPeerEvaluations(
  manager: EntityManager,
  sessionId: string,
): Promise<Array<{ studentId: string; sessionScore: string | number }>> {
  return manager.query(FIND_SESSION_PEER_EVALUATIONS_QUERY, [sessionId]);
}

export function readSessionTutorScores(
  manager: EntityManager,
  sessionId: string,
): Promise<TutorScoreRow[]> {
  return manager.query<TutorScoreRow[]>(FIND_SESSION_TUTOR_SCORES_QUERY, [sessionId]);
}

export async function readStudentParticipant(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
): Promise<StudentRow | null> {
  const [row] = await manager.query<StudentRow[]>(FIND_STUDENT_PARTICIPANT_QUERY, [
    sessionId,
    studentId,
  ]);
  return row ?? null;
}

export async function readSessionTiming(
  manager: EntityManager,
  sessionId: string,
): Promise<SessionTimingRow | null> {
  const [row] = await manager.query<SessionTimingRow[]>(FIND_SESSION_TIMINGS_QUERY, [sessionId]);
  return row ?? null;
}

export async function readStudentSelfEvaluation(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
): Promise<SelfEvaluationRow | null> {
  const [row] = await manager.query<SelfEvaluationRow[]>(FIND_STUDENT_SELF_EVALUATION_QUERY, [
    sessionId,
    studentId,
  ]);
  return row ?? null;
}

export function readStudentSelfAdjustments(
  manager: EntityManager,
  evaluationId: string,
): Promise<SelfAdjustmentDetailRow[]> {
  return manager.query<SelfAdjustmentDetailRow[]>(FIND_SELF_ADJUSTMENTS_DETAIL_QUERY, [
    evaluationId,
  ]);
}

export function readStudentTutorScores(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
): Promise<Array<{ criterionId: string; score: string | number }>> {
  return manager.query(FIND_STUDENT_TUTOR_SCORES_QUERY, [sessionId, studentId]);
}

export function readReceivedPeerEvaluations(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
): Promise<ComparisonPeerRow[]> {
  return manager.query<ComparisonPeerRow[]>(FIND_RECEIVED_PEER_EVALUATIONS_QUERY, [
    sessionId,
    studentId,
  ]);
}

export async function readPeerItemRows(
  manager: EntityManager,
  peerIds: string[],
): Promise<Map<string, ComparisonPeerItemRow[]>> {
  if (peerIds.length === 0) return new Map();
  const rows = await manager.query<EvaluationItemRow[]>(
    `SELECT evaluation_id AS "evaluationId", criterion_id AS "criterionId", score
       FROM evaluation_items WHERE evaluation_id = ANY($1) ORDER BY criterion_id;`,
    [peerIds],
  );
  const map = new Map<string, ComparisonPeerItemRow[]>();
  for (const row of rows) {
    const list = map.get(row.evaluationId) ?? [];
    list.push({ criterionId: row.criterionId, score: row.score });
    map.set(row.evaluationId, list);
  }
  return map;
}
