import {
  calculateProblemGrade,
  type GradeComponent,
} from '../../../domain/entities/grade-calculator';
import type { GradeRow } from '../../../domain/repositories/grades.repository';
import type { GradesResponseDto } from '../../dtos/grades-response.dto';
import { buildStudentResponse } from './grade-response.helper';
import {
  calculateSessionComponents,
  summarizeEvaluationComponents,
  withSessionEvaluations,
  type StudentEvaluationComponents,
} from './evaluation-components.helper';
import type { SessionFormulaEntry } from './session-formula.helper';
import {
  processStudentSession,
  processStudentSessionForGrade,
  resolveSessionModality,
} from './session-grade-processing.helper';

export { processStudentSession, processStudentSessionForGrade, resolveSessionModality };

export type Row = GradeRow;

export interface StudentGradeContext {
  student: Row;
  sessions: Row[];
  criteria: Row[];
  scores: Row[];
  attendances: Row[];
  roles: Row[];
  sessionFormulas: SessionFormulaEntry[];
  problemComponents: GradeComponent[];
  problemFormulaVersion: number;
  selfScores: Row[];
  peerScores: Row[];
  pokerScores: Row[];
  peerAdjustments?: Row[];
  now: Date;
}

export type StudentSessionResponse = GradesResponseDto['alunos'][number]['sessoes'][number];
export type SessionGradeResponse = Omit<StudentSessionResponse, 'autoavaliacao' | 'pares'>;
export type StudentResponse = GradesResponseDto['alunos'][number];

export function filterByStudentAndSession(
  rows: Row[],
  sessionId: string,
  studentId: unknown,
): Row | undefined {
  return rows.find((item) => item.session_id === sessionId && item.student_id === studentId);
}

export function mapCriteriaForSession(
  criteria: Row[],
  scores: Row[],
  sessionId: string,
  studentId: unknown,
) {
  return criteria
    .filter((criterion) => criterion.session_id === sessionId)
    .map((criterion) => mapCriterionScore(criterion, scores, sessionId, studentId));
}

function mapCriterionScore(criterion: Row, scores: Row[], sessionId: string, studentId: unknown) {
  const score = scores.find(
    (item) =>
      item.session_id === sessionId &&
      item.student_id === studentId &&
      item.criterion_id === criterion.id,
  );
  return {
    id: String(criterion.id),
    score: score?.score === null || score?.score === undefined ? null : Number(score.score),
    weight: Number(criterion.weight),
  };
}

export function processStudentGrades(ctx: StudentGradeContext) {
  const results = ctx.sessions.map((session) => {
    const evaluations = calculateSessionComponents(ctx, session);
    const sessionResult = processStudentSessionForGrade(ctx, session, evaluations);
    return {
      ...sessionResult,
      evaluations,
    };
  });
  const sessionRows = results.map((result) => result.row);
  const evaluations = summarizeEvaluationComponents(results.map((result) => result.evaluations));
  const grades = results.map((result) =>
    withSessionEvaluations(result.responseSession, result.evaluations),
  );
  const finalGrade = calculateProblemGrade(ctx.problemComponents, sessionGrades(sessionRows));

  return buildStudentResult(ctx, grades, finalGrade.grade, sessionRows, evaluations);
}

function sessionGrades(rows: Row[]): Array<{ sessionId: string; grade: number | null }> {
  return rows.map((row) => ({
    sessionId: String(row.session_id),
    grade: row.grade as number | null,
  }));
}

function buildStudentResult(
  ctx: StudentGradeContext,
  grades: StudentSessionResponse[],
  finalGrade: number | null,
  sessionRows: Row[],
  evaluations: StudentEvaluationComponents,
) {
  return {
    responseStudent: buildStudentResponse(ctx.student, grades, finalGrade, evaluations),
    sessionRows,
    problemRow: {
      student_id: ctx.student.id,
      grade: finalGrade,
      formula_version: ctx.problemFormulaVersion,
    },
  };
}
