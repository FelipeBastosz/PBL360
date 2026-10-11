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
      'SELECT id, performance_table_id FROM problems WHERE id = $1 AND room_id = $2',
      [problemId, roomId],
    );
    return rows[0] ?? null;
  }

  async findProblemData(
    roomId: string,
    problemId: string,
    performanceTableId: unknown,
  ): Promise<ProblemGradeData> {
    const queries = buildProblemQueries(roomId, problemId, performanceTableId);
    const [
      sessions = [],
      students = [],
      formulas = [],
      scores = [],
      attendances = [],
      roles = [],
      criteria = [],
    ] = await this.grades.transaction('REPEATABLE READ', (manager) =>
      Promise.all(queries.map(({ sql, params }) => manager.query<GradeRow[]>(sql, params))),
    );

    return { sessions, students, formulas, scores, attendances, roles, criteria };
  }

  async findFormulaComponents(formulaIds: unknown[]): Promise<GradeRow[]> {
    if (formulaIds.length === 0) return [];

    const rows = await this.grades.query<GradeRow[]>(
      'SELECT formula_id, type, reference_id, weight FROM formula_components WHERE formula_id = ANY($1::uuid[])',
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
