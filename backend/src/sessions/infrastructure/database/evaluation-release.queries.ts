import type { EntityManager } from 'typeorm';

import type { ReleaseSubmissions } from '../../domain/repositories/session.repository';

const COUNT_RELEASE_SUBMISSIONS_QUERY = `SELECT
       EXISTS (SELECT 1 FROM attendances WHERE session_id = $1) AS "rollCallSaved",
       (SELECT COUNT(*) FROM attendances
         WHERE session_id = $1 AND status IN ('PRESENT', 'LATE'))::int AS "presentStudents",
       COUNT(DISTINCT evaluator_id) FILTER (WHERE type = 'SELF_ASSESSMENT')::int AS "selfSubmitted",
       COUNT(DISTINCT (evaluator_id, student_id))
         FILTER (WHERE type = 'PEER_ASSESSMENT')::int AS "peerSubmitted",
       COUNT(*) FILTER (WHERE type = 'TUTOR_SESSION')::int AS "tutorSubmitted",
       EXISTS (SELECT 1 FROM poker_sessions WHERE session_id = $1) AS "pokerStarted"
     FROM evaluations
     WHERE session_id = $1 AND status = 'SUBMITTED';`;

const DEFAULT_SUBMISSIONS: ReleaseSubmissions = {
  rollCallSaved: false,
  presentStudents: 0,
  selfSubmitted: 0,
  peerSubmitted: 0,
  tutorSubmitted: 0,
};

export async function countReleaseSubmissions(
  manager: EntityManager,
  sessionId: string,
): Promise<ReleaseSubmissions> {
  const [row] = await manager.query<ReleaseSubmissions[]>(COUNT_RELEASE_SUBMISSIONS_QUERY, [
    sessionId,
  ]);
  return row ?? DEFAULT_SUBMISSIONS;
}
