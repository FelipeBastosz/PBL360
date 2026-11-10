import type { EntityManager } from 'typeorm';
import { requireFirstRow } from '@/shared/database/rows';
import type { ProblemDeletionImpact } from '../../domain/repositories/problem.repository';

export async function readProblemDeletionImpact(
  manager: EntityManager,
  problemId: string,
): Promise<ProblemDeletionImpact> {
  const rows = await manager.query<ProblemDeletionImpact[]>(
    `SELECT
       (SELECT COUNT(*)::int FROM sessions WHERE problem_id = $1) AS sessions,
       (SELECT COUNT(*)::int FROM problem_grades WHERE problem_id = $1) AS grades,
       (SELECT COUNT(*)::int FROM feedback WHERE problema_id = $1) AS feedbacks,
       (SELECT COUNT(*)::int FROM evaluations WHERE problem_id = $1) AS evaluations;`,
    [problemId],
  );
  return requireFirstRow(rows, 'Failed to read problem deletion impact.');
}
