import {
  calculateProblemGrade,
  calculateSessionGrade,
  presentGrade,
  type GradeComponent,
  type GradeAttendance,
} from '../../../domain/entities/grade-calculator';

import type { GradeRow } from '../../../domain/repositories/grades.repository';
import type { GradesResponseDto } from '../../dtos/grades-response.dto';
import { buildStudentResponse } from './grade-response.helper';

export type Row = GradeRow;

export function buildDefaultSessionComponents(sessionId: string, formulaId: string): Row[] {
  return [
    { formula_id: formulaId, type: 'CRITERIOS', weight: 70, session_id: sessionId },
    { formula_id: formulaId, type: 'PAPEL', weight: 30, session_id: sessionId },
  ];
}

export interface SessionFormulaEntry {
  sessionId: string;
  components: GradeComponent[];
  formulaVersion: number;
  defaultFormula: boolean;
}

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
}

export type StudentSessionResponse = GradesResponseDto['alunos'][number]['sessoes'][number];
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

function extractSessionInputs(ctx: {
  session: Row;
  student: Row;
  criteria: Row[];
  scores: Row[];
  attendances: Row[];
  roles: Row[];
}) {
  const sessionId = String(ctx.session.id);
  const criteria = mapCriteriaForSession(ctx.criteria, ctx.scores, sessionId, ctx.student.id);
  const attendance =
    (filterByStudentAndSession(ctx.attendances, sessionId, ctx.student.id)
      ?.status as GradeAttendance) ?? null;
  const rawBonus = filterByStudentAndSession(ctx.roles, sessionId, ctx.student.id)?.bonus_score;
  const bonus = rawBonus === null || rawBonus === undefined ? null : Number(rawBonus);

  return { criteria, attendance, bonus };
}

export function processStudentSession(ctx: {
  session: Row;
  student: Row;
  criteria: Row[];
  scores: Row[];
  attendances: Row[];
  roles: Row[];
  sessionComponents: GradeComponent[];
  formulaVersion: number;
  defaultSessionFormula: boolean;
}) {
  const sessionId = String(ctx.session.id);
  const calculated = calculateSessionForContext(ctx);

  return {
    row: buildSessionRow(ctx, sessionId, calculated),
    responseSession: buildSessionResponse(sessionId, calculated),
  };
}

function calculateSessionForContext(ctx: {
  session: Row;
  student: Row;
  criteria: Row[];
  scores: Row[];
  attendances: Row[];
  roles: Row[];
  sessionComponents: GradeComponent[];
  defaultSessionFormula: boolean;
}) {
  const { criteria, attendance, bonus } = extractSessionInputs(ctx);
  return calculateSessionGrade({
    criteria,
    components: ctx.sessionComponents,
    attendance,
    bonus,
    defaultFormula: ctx.defaultSessionFormula,
  });
}

function buildSessionRow(
  ctx: { student: Row; formulaVersion: number },
  sessionId: string,
  calculated: ReturnType<typeof calculateSessionGrade>,
): Row {
  return {
    session_id: sessionId,
    student_id: String(ctx.student.id),
    grade: calculated.grade,
    situation: calculated.situation,
    formula_version: ctx.formulaVersion,
  };
}

function buildSessionResponse(
  sessionId: string,
  calculated: ReturnType<typeof calculateSessionGrade>,
): StudentSessionResponse {
  return {
    sessaoId: sessionId,
    nota: presentGrade(calculated.grade),
    situacao: calculated.situation,
  };
}

export function processStudentGrades(ctx: StudentGradeContext) {
  const results = ctx.sessions.map((session) => processStudentSessionForGrade(ctx, session));
  const sessionRows = results.map((result) => result.row);
  const grades = results.map((result) => result.responseSession);

  const finalGrade = calculateProblemGrade(ctx.problemComponents, sessionGrades(sessionRows));

  return buildStudentResult(ctx, grades, finalGrade.grade, sessionRows);
}

function processStudentSessionForGrade(ctx: StudentGradeContext, session: Row) {
  const sessionId = String(session.id);
  const formula = sessionFormulaFor(ctx.sessionFormulas, sessionId);
  return processStudentSession({
    session,
    student: ctx.student,
    criteria: ctx.criteria,
    scores: ctx.scores,
    attendances: ctx.attendances,
    roles: ctx.roles,
    sessionComponents: formula.components,
    formulaVersion: formula.formulaVersion,
    defaultSessionFormula: formula.defaultFormula,
  });
}

function sessionFormulaFor(
  formulas: SessionFormulaEntry[],
  sessionId: string,
): SessionFormulaEntry {
  return (
    formulas.find((entry) => entry.sessionId === sessionId) ?? {
      sessionId,
      components: [
        { type: 'CRITERIOS', weight: 70 },
        { type: 'PAPEL', weight: 30 },
      ],
      formulaVersion: 1,
      defaultFormula: true,
    }
  );
}

function sessionGrades(rows: Row[]): Array<number | null> {
  return rows.map((row) => row.grade as number | null);
}

function buildStudentResult(
  ctx: StudentGradeContext,
  grades: StudentSessionResponse[],
  finalGrade: number | null,
  sessionRows: Row[],
) {
  return {
    sessionRows,
    problemRow: {
      student_id: ctx.student.id,
      grade: finalGrade,
      formula_version: ctx.problemFormulaVersion,
    },
    responseStudent: buildStudentResponse(ctx.student, grades, finalGrade),
  };
}
