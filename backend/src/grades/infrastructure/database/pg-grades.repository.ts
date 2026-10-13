import { Injectable } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { buildProblemQueries } from './grades-queries';
import type {
  GradePersistenceData,
  GradeRow,
  GradesRepository,
  ProblemGradeData,
} from '../../domain/repositories/grades.repository';

@Injectable()
export class PgGradesRepository implements GradesRepository {
  constructor(@InjectDataSource() private readonly grades: DataSource) {}

  async findProblem(problemId: string, roomId: string): Promise<GradeRow | null> {
    const rows = await this.grades.query<GradeRow[]>(
      'SELECT id FROM problems WHERE id = $1 AND room_id = $2',
      [problemId, roomId],
    );
    return rows[0] ?? null;
  }

  async findProblemData(roomId: string, problemId: string): Promise<ProblemGradeData> {
    const queries = buildProblemQueries(roomId, problemId);
    const results = await this.grades.transaction('REPEATABLE READ', (manager) =>
      Promise.all(queries.map(({ sql, params }) => manager.query<GradeRow[]>(sql, params))),
    );
    return toProblemGradeData(results);
  }

  async findFormulaComponents(formulaIds: unknown[]): Promise<GradeRow[]> {
    if (formulaIds.length === 0) return [];

    const rows = await this.grades.query<GradeRow[]>(
      `SELECT fc.formula_id, fc.type, fc.reference_id, fc.weight, f.session_id
         FROM formula_components fc
         JOIN formulas f ON f.id = fc.formula_id
        WHERE fc.formula_id = ANY($1::uuid[])`,
      [formulaIds],
    );
    return rows ?? [];
  }

  async saveGrades(problemId: string, result: GradePersistenceData): Promise<void> {
    await this.grades.transaction(async (manager) => {
      for (const row of result.sessionRows) {
        await manager.query(
          'INSERT INTO session_grades (session_id, student_id, grade, situation, formula_version) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (session_id, student_id) DO UPDATE SET grade = EXCLUDED.grade, situation = EXCLUDED.situation, formula_version = EXCLUDED.formula_version, calculated_at = now()',
          [row.session_id, row.student_id, row.grade, row.situation, row.formula_version],
        );
      }

      for (const row of result.problemRows) {
        await manager.query(
          'INSERT INTO problem_grades (problem_id, student_id, grade, formula_version) VALUES ($1, $2, $3, $4) ON CONFLICT (problem_id, student_id) DO UPDATE SET grade = EXCLUDED.grade, formula_version = EXCLUDED.formula_version, calculated_at = now()',
          [problemId, row.student_id, row.grade, row.formula_version],
        );
      }
    });
  }
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
  };
}
