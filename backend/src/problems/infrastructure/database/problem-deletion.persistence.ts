import type { EntityManager } from 'typeorm';
import { firstRowOrNull } from '@/shared/database/rows';
import { assertProblemCanBeDeleted } from '../../domain/services/problem-deletion-policy';
import { readProblemDeletionImpact } from './problem-deletion-impact.queries';

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

  assertProblemCanBeDeleted(await readProblemDeletionImpact(manager, id));
  await manager.query('DELETE FROM problems WHERE id = $1 AND room_id = $2;', [id, roomId]);
  await decrementFollowingOrders(manager, roomId, Number(target.orderIndex));
}
