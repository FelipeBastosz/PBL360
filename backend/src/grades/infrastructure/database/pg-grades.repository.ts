import { Injectable } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { readProblemGradeData, readFormulaComponents } from './problem-grade-data.reads';
import { FIND_PROBLEM_OBSERVATION_TAGS_QUERY } from './problem-observation-tags.queries';
import type {
  GradePersistenceData,
  GradeRow,
  GradesRepository,
  ProblemGradeData,
  ProblemObservationTagDetail,
} from '../../domain/repositories/grades.repository';

const parseTags = (tags: unknown): string[] => {
  if (Array.isArray(tags)) return tags.filter((t): t is string => typeof t === 'string');
  if (typeof tags === 'string') {
    try {
      const parsed: unknown = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed.filter((t): t is string => typeof t === 'string');
    } catch {
      return [];
    }
  }
  return [];
};

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
    return this.grades.transaction('REPEATABLE READ', (manager) =>
      readProblemGradeData(manager, roomId, problemId),
    );
  }

  findFormulaComponents(formulaIds: unknown[]): Promise<GradeRow[]> {
    return readFormulaComponents(this.grades.manager, formulaIds);
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

  async findProblemObservationTags(problemId: string): Promise<ProblemObservationTagDetail[]> {
    const rows = await this.grades.query<
      Array<{
        studentId: string;
        sessionId: string;
        sessionTitle: string;
        sessionOrderIndex: number | null;
        tags: unknown;
      }>
    >(FIND_PROBLEM_OBSERVATION_TAGS_QUERY, [problemId]);

    return rows.map((r) => ({
      studentId: r.studentId,
      sessionId: r.sessionId,
      sessionTitle: r.sessionTitle,
      sessionOrderIndex: r.sessionOrderIndex,
      tags: parseTags(r.tags),
    }));
  }
}
