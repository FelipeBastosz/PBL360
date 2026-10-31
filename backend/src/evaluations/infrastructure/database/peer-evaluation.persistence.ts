import type { EntityManager } from 'typeorm';
import { lockSessionPerformanceTable } from '@/sessions/infrastructure/database/session-table-lock.persistence';
import { ConflictError } from '@/shared/errors/application.error';
import { validateEvaluationRules } from '../../application/services/evaluation-rule-validation';
import { EvaluationRules } from '../../domain/services/evaluation-rules';
import {
  SessionGradeCalculator,
  SESSION_CALCULATION_VERSION,
} from '../../domain/services/session-grade-calculator';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type { SessionEvaluationConfig } from '../../domain/entities/session-evaluation-config.entity';
import type {
  PeerEvaluationDetail,
  PeerEvaluationWrite,
} from '../../domain/repositories/evaluation.repository';
import { toEvaluation, type EvaluationItemRow, type EvaluationRow } from './evaluation-row.mapper';
import { freezeSessionConfig } from './session-evaluation-config.persistence';
import { findPeerOrThrow } from './peer-evaluation.reads';
import {
  FIND_PEER_EVALUATION,
  FIND_PEER_ITEMS,
  INSERT_INITIAL_PEER_EVALUATION,
  UPDATE_PEER_DRAFT,
  UPDATE_PEER_SUBMISSION,
} from './peer-evaluation.queries';

export async function recordPeerEvaluation(
  manager: EntityManager,
  input: PeerEvaluationWrite,
): Promise<PeerEvaluationDetail> {
  return manager.transaction((tx) => executePeerEvaluationTx(tx, input));
}

async function assertCanEvaluatePeer(tx: EntityManager, input: PeerEvaluationWrite) {
  const peer = await findPeerOrThrow(tx, input.sessionId, input.evaluatorId, input.peerId);
  const [existing] = await tx.query<Array<{ id: string; status: EvaluationStatus }>>(
    `SELECT id, status FROM evaluations
      WHERE session_id = $1 AND evaluator_id = $2 AND student_id = $3 AND type = 'PEER_ASSESSMENT'
      FOR UPDATE;`,
    [input.sessionId, input.evaluatorId, input.peerId],
  );
  if (existing?.status === EvaluationStatus.SUBMITTED) {
    throw new ConflictError('A avaliação deste colega já foi enviada e não pode ser alterada.');
  }
  return { peer, existingId: existing?.id };
}

async function insertPeerEvaluation(
  tx: EntityManager,
  input: PeerEvaluationWrite,
  tableId: string,
): Promise<string> {
  const [inserted] = await tx.query<Array<{ id: string }>>(INSERT_INITIAL_PEER_EVALUATION, [
    input.evaluatorId,
    input.peerId,
    input.problemId,
    input.sessionId,
    tableId,
  ]);
  if (inserted) return inserted.id;
  const [found] = await tx.query<Array<{ id: string }>>(
    `SELECT id FROM evaluations
      WHERE session_id = $1 AND evaluator_id = $2 AND student_id = $3 AND type = 'PEER_ASSESSMENT';`,
    [input.sessionId, input.evaluatorId, input.peerId],
  );
  return found!.id;
}

async function ensurePeerEvaluationId(
  tx: EntityManager,
  input: PeerEvaluationWrite,
  tableId: string,
  existingId?: string,
): Promise<string> {
  return existingId ?? insertPeerEvaluation(tx, input, tableId);
}

async function updatePeerStatus(
  tx: EntityManager,
  input: PeerEvaluationWrite,
  config: SessionEvaluationConfig,
  evaluationId: string,
): Promise<void> {
  const now = new Date();
  if (!input.submit) {
    await tx.query(UPDATE_PEER_DRAFT, [input.evaluatorId, now, evaluationId]);
    return;
  }
  await submitPeerEvaluation(tx, input, config, evaluationId, now);
}

async function submitPeerEvaluation(
  tx: EntityManager,
  input: PeerEvaluationWrite,
  config: SessionEvaluationConfig,
  evaluationId: string,
  now: Date,
): Promise<void> {
  const notaCargo = input.notaCargo ?? null;
  const score = calculatePeerScore(input, config, notaCargo);
  await tx.query(UPDATE_PEER_SUBMISSION, [
    input.evaluatorId,
    now,
    score,
    notaCargo,
    SESSION_CALCULATION_VERSION,
    evaluationId,
  ]);
}

function calculatePeerScore(
  input: PeerEvaluationWrite,
  config: SessionEvaluationConfig,
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

async function replaceEvaluationItems(
  tx: EntityManager,
  evaluationId: string,
  items: PeerEvaluationWrite['items'],
): Promise<void> {
  await tx.query('DELETE FROM evaluation_items WHERE evaluation_id = $1;', [evaluationId]);
  for (const item of items) {
    await tx.query(
      'INSERT INTO evaluation_items (evaluation_id, criterion_id, score) VALUES ($1, $2, $3);',
      [evaluationId, item.criterionId, item.score],
    );
  }
}

async function persistPeerItemsAndStatus(
  tx: EntityManager,
  input: PeerEvaluationWrite,
  config: SessionEvaluationConfig,
  evaluationId: string,
): Promise<void> {
  await updatePeerStatus(tx, input, config, evaluationId);
  await replaceEvaluationItems(tx, evaluationId, input.items);
}

async function executePeerEvaluationTx(
  tx: EntityManager,
  input: PeerEvaluationWrite,
): Promise<PeerEvaluationDetail> {
  await lockSessionPerformanceTable(tx, input.sessionId);
  const { peer, existingId } = await assertCanEvaluatePeer(tx, input);
  const config = await freezeSessionConfig(tx, input.sessionId, input.evaluatorId);
  validateEvaluationRules(() =>
    EvaluationRules.assertValidItems(input.items, config.criteria, input.submit),
  );
  const evaluationId = await ensurePeerEvaluationId(tx, input, config.tableId, existingId);
  await persistPeerItemsAndStatus(tx, input, config, evaluationId);
  return readUpdatedPeerDetail(tx, input, peer, config, evaluationId);
}

async function readUpdatedPeerDetail(
  tx: EntityManager,
  input: PeerEvaluationWrite,
  peer: { id: string; name: string },
  config: SessionEvaluationConfig,
  evaluationId: string,
): Promise<PeerEvaluationDetail> {
  const [updatedRow] = await tx.query<EvaluationRow[]>(FIND_PEER_EVALUATION, [
    input.sessionId,
    input.evaluatorId,
    input.peerId,
  ]);
  const items = await tx.query<EvaluationItemRow[]>(FIND_PEER_ITEMS, [evaluationId]);
  return { peer, config, evaluation: toEvaluation(updatedRow!, items) };
}
