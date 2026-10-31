import type { EntityManager } from 'typeorm';
import { recalculateEvaluation } from '../../domain/services/recalculate-evaluation';
import { readSubmittedConfig } from './submitted-student-config.reads';
import { UnprocessableEntityError } from '@/shared/errors/application.error';
import type { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type {
  EvaluationContext,
  PeerEvaluationDetail,
  PeerEvaluationSummary,
} from '../../domain/repositories/evaluation.repository';
import { toEvaluation, type EvaluationItemRow, type EvaluationRow } from './evaluation-row.mapper';
import { readSessionConfig, readSessionTableConfig } from './session-evaluation-config.persistence';
import {
  FIND_PEER_EVALUATION,
  FIND_PEER_ITEMS,
  FIND_PEER_STUDENT,
  IS_STUDENT_PARTICIPATING,
  LIST_SESSION_PEERS,
} from './peer-evaluation.queries';

export async function isStudentParticipating(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
): Promise<boolean> {
  const rows = await manager.query<unknown[]>(IS_STUDENT_PARTICIPATING, [sessionId, studentId]);
  return rows.length > 0;
}

export async function listSessionPeers(
  manager: EntityManager,
  sessionId: string,
  evaluatorId: string,
): Promise<PeerEvaluationSummary[]> {
  const participating = await isStudentParticipating(manager, sessionId, evaluatorId);
  if (!participating) return [];

  const rows = await manager.query<
    Array<{ alunoId: string; nome: string; status: EvaluationStatus | null; papel: string | null }>
  >(LIST_SESSION_PEERS, [sessionId, evaluatorId]);

  return rows.map((row) => ({
    alunoId: row.alunoId,
    nome: row.nome,
    status: row.status,
    papel: row.papel ?? null,
  }));
}

export async function findPeerOrThrow(
  manager: EntityManager,
  sessionId: string,
  evaluatorId: string,
  peerId: string,
): Promise<{ id: string; name: string }> {
  if (evaluatorId === peerId) {
    throw new UnprocessableEntityError('Um aluno não pode avaliar a si mesmo como par.');
  }
  const [peer] = await manager.query<Array<{ id: string; name: string }>>(FIND_PEER_STUDENT, [
    sessionId,
    peerId,
  ]);
  if (!peer) {
    throw new UnprocessableEntityError('O colega não participou da sessão.');
  }
  return peer;
}

export async function getPeerEvaluation(
  manager: EntityManager,
  context: EvaluationContext,
  evaluatorId: string,
  peerId: string,
): Promise<PeerEvaluationDetail> {
  const sessionId = context.sessionId;
  const peer = await findPeerOrThrow(manager, sessionId, evaluatorId, peerId);
  const config =
    (await readSessionConfig(manager, sessionId)) ??
    (await readSessionTableConfig(manager, sessionId));

  const evaluation = await readPeerEvaluation(manager, sessionId, evaluatorId, peerId);
  const effective = await readSubmittedConfig(manager, sessionId, evaluation, config);
  return {
    peer,
    config: effective,
    evaluation: recalculateEvaluation(evaluation, effective, false),
  };
}

async function readPeerEvaluation(
  manager: EntityManager,
  sessionId: string,
  evaluatorId: string,
  peerId: string,
) {
  const [row] = await manager.query<EvaluationRow[]>(FIND_PEER_EVALUATION, [
    sessionId,
    evaluatorId,
    peerId,
  ]);
  if (!row) return null;
  const items = await manager.query<EvaluationItemRow[]>(FIND_PEER_ITEMS, [row.id]);
  return toEvaluation(row, items);
}
