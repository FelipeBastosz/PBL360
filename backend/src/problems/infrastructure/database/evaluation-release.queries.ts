import type { EntityManager } from 'typeorm';

import type { ReleaseSubmissions } from '../../domain/repositories/problem.repository';

export async function countReleaseSubmissions(
  manager: EntityManager,
  problemId: string,
  roomId: string,
): Promise<ReleaseSubmissions> {
  const [row] = await manager.query<ReleaseSubmissions[]>(
    `SELECT
       (SELECT COUNT(*) FROM room_students WHERE room_id = $2)::int AS students,
       COUNT(DISTINCT evaluator_id) FILTER (WHERE type = 'SELF_ASSESSMENT')::int AS "selfSubmitted",
       COUNT(DISTINCT (evaluator_id, student_id))
         FILTER (WHERE type = 'PEER_ASSESSMENT')::int AS "peerSubmitted"
     FROM evaluations
     WHERE problem_id = $1 AND status = 'SUBMITTED';`,
    [problemId, roomId],
  );
  return row ?? { students: 0, selfSubmitted: 0, peerSubmitted: 0 };
}
