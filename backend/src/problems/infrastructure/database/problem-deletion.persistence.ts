import type { EntityManager } from 'typeorm';

import { firstRowOrNull } from '@/shared/database/rows';
import { ConflictError } from '@/shared/errors/application.error';

import type { ProblemDeletionImpactCounts } from '../../domain/repositories/problem.repository';

const DELETION_IMPACT_QUERY = `SELECT
  (SELECT COUNT(*)::int FROM sessions WHERE problem_id = $1) AS sessions,
  (SELECT COUNT(*)::int FROM evaluations WHERE problem_id = $1) AS evaluations,
  (SELECT COUNT(*)::int FROM feedback WHERE problema_id = $1) AS feedbacks,
  (SELECT COUNT(*)::int FROM problem_grades WHERE problem_id = $1) AS grades;`;

export async function fetchProblemDeletionImpact(
  manager: EntityManager,
  problemId: string,
): Promise<ProblemDeletionImpactCounts> {
  type Row = { sessions: number; evaluations: number; feedbacks: number; grades: number };
  const rows = await manager.query<Row[]>(DELETION_IMPACT_QUERY, [problemId]);
  const row = firstRowOrNull(rows);
  return {
    sessions: Number(row?.sessions ?? 0),
    evaluations: Number(row?.evaluations ?? 0),
    feedbacks: Number(row?.feedbacks ?? 0),
    grades: Number(row?.grades ?? 0),
  };
}

async function assertNoSessions(manager: EntityManager, id: string): Promise<void> {
  const rows = await manager.query<Array<{ exists: boolean }>>(
    'SELECT EXISTS (SELECT 1 FROM sessions WHERE problem_id = $1) AS exists;',
    [id],
  );
  if (firstRowOrNull(rows)?.exists) {
    throw new ConflictError('O problema possui sessões e não pode ser excluído.');
  }
}

async function cleanupProblemDependencies(
  manager: EntityManager,
  id: string,
  roomId: string,
): Promise<void> {
  await manager.query(
    'DELETE FROM feedback_revisions WHERE feedback_id IN (SELECT id FROM feedback WHERE problema_id = $1);',
    [id],
  );
  await manager.query('DELETE FROM feedback WHERE problema_id = $1;', [id]);
  await manager.query('DELETE FROM problems WHERE id = $1 AND room_id = $2;', [id, roomId]);
}

async function decrementFollowingOrders(
  manager: EntityManager,
  roomId: string,
  orderIndex: number,
): Promise<void> {
  await manager.query(
    'UPDATE problems SET order_index = order_index - 1 WHERE room_id = $1 AND order_index > $2;',
    [roomId, orderIndex],
  );
}

export async function deleteProblemTransactionally(
  manager: EntityManager,
  id: string,
  roomId: string,
): Promise<void> {
  await manager.query('SELECT id FROM rooms WHERE id = $1 FOR UPDATE;', [roomId]);
  const targetRows = await manager.query<Array<{ orderIndex: number }>>(
    'SELECT order_index AS "orderIndex" FROM problems WHERE id = $1 AND room_id = $2 FOR UPDATE;',
    [id, roomId],
  );
  const target = firstRowOrNull(targetRows);
  if (!target) return;

  await assertNoSessions(manager, id);
  await cleanupProblemDependencies(manager, id, roomId);
  await decrementFollowingOrders(manager, roomId, Number(target.orderIndex));
}
