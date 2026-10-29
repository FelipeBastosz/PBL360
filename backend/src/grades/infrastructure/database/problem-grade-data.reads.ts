import type { EntityManager } from 'typeorm';
import type { GradeRow, ProblemGradeData } from '../../domain/repositories/grades.repository';
import { buildProblemQueries } from './grades-queries';

export async function readProblemGradeData(
  manager: EntityManager,
  roomId: string,
  problemId: string,
): Promise<ProblemGradeData> {
  const results: GradeRow[][] = [];
  for (const { sql, params } of buildProblemQueries(roomId, problemId)) {
    results.push(await manager.query<GradeRow[]>(sql, params));
  }
  return toProblemGradeData(results);
}

export async function readFormulaComponents(
  manager: EntityManager,
  formulaIds: unknown[],
): Promise<GradeRow[]> {
  if (formulaIds.length === 0) return [];
  return manager.query<GradeRow[]>(
    `SELECT fc.formula_id, fc.type, fc.reference_id, fc.weight, f.session_id
       FROM formula_components fc JOIN formulas f ON f.id = fc.formula_id
      WHERE fc.formula_id = ANY($1::uuid[])`,
    [formulaIds],
  );
}

function toProblemGradeData(results: GradeRow[][]): ProblemGradeData {
  const at = (index: number): GradeRow[] => results[index] ?? [];
  return {
    sessions: at(0),
    students: at(1),
    formulas: at(2),
    scores: at(3),
    attendances: at(4),
    roles: at(5),
    criteria: at(6),
    selfScores: at(7),
    peerScores: at(8),
    pokerScores: at(9),
    peerAdjustments: at(10),
  };
}
