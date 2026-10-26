import type { EntityManager } from 'typeorm';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type { EvaluationAdjustment } from '../../domain/entities/grade-adjustment.entity';
import type { SelfAssessmentAdjustmentHistory } from '../../domain/repositories/self-assessment-adjustment.repository';
import {
  FIND_EVALUATION_ADJUSTMENTS,
  FIND_PEER_FORM_ADJUSTMENTS,
  FIND_PEER_FORM_SCORES,
  FIND_POKER_ADJUSTMENTS,
  FIND_POKER_ROUND_SCORE,
  FIND_SELF_ASSESSMENT_SCORE,
  FIND_SESSION_EVALUATION_RELEASES,
  LOCK_PEER_FORM_SCORES,
  LOCK_POKER_ROUND_SCORE,
  LOCK_SELF_ASSESSMENT_SCORE,
} from './self-assessment-adjustment.queries';

interface SessionReleaseRow {
  selfEvalReleased: boolean;
  peerEvalReleased: boolean;
}

interface ScoreRow {
  id: string;
  status: EvaluationStatus;
  sessionScore: string | null;
}

interface PokerRoundRow {
  id: string;
  status: string;
  sessionScore: string | null;
}

export interface AdjustmentRow extends Omit<EvaluationAdjustment, 'previousValue' | 'newValue'> {
  previousValue: string;
  newValue: string;
}

export async function resolveAndReadHistory(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
  lock: boolean,
  tipo?: 'AUTOAVALIACAO' | 'PARES',
): Promise<SelfAssessmentAdjustmentHistory | null> {
  const target = tipo ?? (await resolveModality(manager, sessionId, studentId));
  if (target === 'PARES') {
    return readPeerHistory(manager, sessionId, studentId, lock);
  }
  return readSelfHistory(manager, sessionId, studentId, lock);
}

async function resolveModality(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
): Promise<'AUTOAVALIACAO' | 'PARES'> {
  const [session] = await manager.query<SessionReleaseRow[]>(FIND_SESSION_EVALUATION_RELEASES, [
    sessionId,
  ]);
  if (session?.peerEvalReleased) return 'PARES';
  if (session?.selfEvalReleased) return 'AUTOAVALIACAO';
  return detectStudentModality(manager, sessionId, studentId);
}

async function detectStudentModality(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
): Promise<'AUTOAVALIACAO' | 'PARES'> {
  const [self] = await manager.query<ScoreRow[]>(FIND_SELF_ASSESSMENT_SCORE, [
    sessionId,
    studentId,
  ]);
  if (self) return 'AUTOAVALIACAO';
  const [poker] = await manager.query<PokerRoundRow[]>(FIND_POKER_ROUND_SCORE, [
    sessionId,
    studentId,
  ]);
  if (poker) return 'PARES';
  const peers = await manager.query<ScoreRow[]>(FIND_PEER_FORM_SCORES, [sessionId, studentId]);
  return peers.length > 0 ? 'PARES' : 'AUTOAVALIACAO';
}

async function readSelfHistory(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
  lock: boolean,
): Promise<SelfAssessmentAdjustmentHistory | null> {
  const query = lock ? LOCK_SELF_ASSESSMENT_SCORE : FIND_SELF_ASSESSMENT_SCORE;
  const [row] = await manager.query<ScoreRow[]>(query, [sessionId, studentId]);
  if (!row) return null;
  const adjustments = await manager.query<AdjustmentRow[]>(FIND_EVALUATION_ADJUSTMENTS, [row.id]);
  return {
    evaluationId: row.id,
    status: row.status,
    originalScore: row.sessionScore === null ? null : Number(row.sessionScore),
    adjustments: adjustments.map(toAdjustment),
    tipo: 'AUTOAVALIACAO',
  };
}

async function readPeerHistory(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
  lock: boolean,
): Promise<SelfAssessmentAdjustmentHistory | null> {
  const poker = await readPokerHistory(manager, sessionId, studentId, lock);
  if (poker) return poker;
  return readPeerFormHistory(manager, sessionId, studentId, lock);
}

const buildPokerHistory = (
  row: PokerRoundRow,
  adjustments: AdjustmentRow[],
): SelfAssessmentAdjustmentHistory => ({
  pokerRoundId: row.id,
  status: EvaluationStatus.SUBMITTED,
  originalScore: row.sessionScore === null ? null : Number(row.sessionScore),
  adjustments: adjustments.map(toAdjustment),
  tipo: 'PARES',
});

async function readPokerHistory(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
  lock: boolean,
): Promise<SelfAssessmentAdjustmentHistory | null> {
  const query = lock ? LOCK_POKER_ROUND_SCORE : FIND_POKER_ROUND_SCORE;
  const [row] = await manager.query<PokerRoundRow[]>(query, [sessionId, studentId]);
  if (!row) return null;
  if (row.status !== 'DECIDED') {
    return { status: EvaluationStatus.DRAFT, originalScore: null, adjustments: [], tipo: 'PARES' };
  }
  const adjustments = await manager.query<AdjustmentRow[]>(FIND_POKER_ADJUSTMENTS, [row.id]);
  return buildPokerHistory(row, adjustments);
}

const draftPeer = (sessionId: string, studentId: string): SelfAssessmentAdjustmentHistory => ({
  sessionId,
  studentId,
  status: EvaluationStatus.DRAFT,
  originalScore: null,
  adjustments: [],
  tipo: 'PARES',
});

const buildPeerFormHistory = (
  sessionId: string,
  studentId: string,
  submitted: ScoreRow[],
  adjustments: AdjustmentRow[],
): SelfAssessmentAdjustmentHistory => ({
  sessionId,
  studentId,
  status: EvaluationStatus.SUBMITTED,
  originalScore: averageScore(submitted),
  adjustments: adjustments.map(toAdjustment),
  tipo: 'PARES',
});

async function readPeerFormHistory(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
  lock: boolean,
): Promise<SelfAssessmentAdjustmentHistory | null> {
  const query = lock ? LOCK_PEER_FORM_SCORES : FIND_PEER_FORM_SCORES;
  const rows = await manager.query<ScoreRow[]>(query, [sessionId, studentId]);
  if (rows.length === 0) return null;
  const submitted = rows.filter(
    (r) => r.status === EvaluationStatus.SUBMITTED && r.sessionScore !== null,
  );
  if (submitted.length === 0) return draftPeer(sessionId, studentId);
  const adjustments = await manager.query<AdjustmentRow[]>(FIND_PEER_FORM_ADJUSTMENTS, [
    sessionId,
    studentId,
  ]);
  return buildPeerFormHistory(sessionId, studentId, submitted, adjustments);
}

const averageScore = (rows: ScoreRow[]) =>
  Math.round((rows.reduce((s, r) => s + Number(r.sessionScore), 0) / rows.length) * 100) / 100;

export const toAdjustment = (row: AdjustmentRow): EvaluationAdjustment => ({
  ...row,
  previousValue: Number(row.previousValue),
  newValue: Number(row.newValue),
});
