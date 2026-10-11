import {
  calculateProblemGrade,
  calculateSessionGrade,
  presentGrade,
  type GradeComponent,
  type GradeAttendance,
} from '../../../domain/entities/grade-calculator';

import type { GradeRow } from '../../../domain/repositories/grades.repository';

export type Row = GradeRow;

export function buildDefaultSessionComponents(criteria: Row[]): Row[] {
  const criteriaBySession = new Map<string, Row[]>();
  for (const criterion of criteria) {
    const sessionId = String(criterion.session_id);
    criteriaBySession.set(sessionId, [...(criteriaBySession.get(sessionId) ?? []), criterion]);
  }
  return [...criteriaBySession].flatMap(([sessionId, sessionCriteria]) => {
    const totalWeight = sessionCriteria.reduce((sum, item) => sum + Number(item.weight), 0);
    return sessionCriteria.map((criterion) => ({
      formula_id: '__default_session',
      type: 'CRITERIO',
      reference_id: criterion.id,
      weight: (Number(criterion.weight) / totalWeight) * 100,
      session_id: sessionId,
    }));
  });
}

export interface StudentGradeContext {
  student: Row;
  sessions: Row[];
  scores: Row[];
  attendances: Row[];
  roles: Row[];
  sessionComponents: GradeComponent[];
  problemComponents: GradeComponent[];
  sessionFormulaVersion: number;
  problemFormulaVersion: number;
  defaultSessionFormula: boolean;
}

export interface StudentSessionResponse {
  sessaoId: string;
  nota: number | null;
  situacao: string;
}

export interface StudentResponse {
  alunoId: string;
  nome: string;
  matricula: string | null;
  sessoes: StudentSessionResponse[];
  notaFinal: number | null;
}

export function filterByStudentAndSession(
  rows: Row[],
  sessionId: string,
  studentId: unknown,
): Row | undefined {
  return rows.find((item) => item.session_id === sessionId && item.student_id === studentId);
}

export function mapCriteriaForSession(scores: Row[], sessionId: string, studentId: unknown) {
  return scores
    .filter((score) => score.session_id === sessionId && score.student_id === studentId)
    .map((score) => ({
      id: String(score.criterion_id),
      score: score.score === null ? null : Number(score.score),
    }));
}

function extractSessionInputs(ctx: {
  session: Row;
  student: Row;
  scores: Row[];
  attendances: Row[];
  roles: Row[];
}) {
  const sessionId = String(ctx.session.id);
  const criteria = mapCriteriaForSession(ctx.scores, sessionId, ctx.student.id);
  const attendance =
    (filterByStudentAndSession(ctx.attendances, sessionId, ctx.student.id)
      ?.status as GradeAttendance) ?? null;
  const rawBonus = filterByStudentAndSession(ctx.roles, sessionId, ctx.student.id)?.bonus_score;
  const bonus = rawBonus === null || rawBonus === undefined ? null : Number(rawBonus);

  return { criteria, attendance, bonus };
}

export function calculateSessionGradeContext(ctx: {
  session: Row;
  student: Row;
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

export function processStudentSession(ctx: {
  session: Row;
  student: Row;
  scores: Row[];
  attendances: Row[];
  roles: Row[];
  sessionComponents: GradeComponent[];
  formulaVersion: number;
  defaultSessionFormula: boolean;
}) {
  const sessionId = String(ctx.session.id);
  const calculated = calculateSessionGradeContext(ctx);

  return {
    row: buildSessionRow(ctx, sessionId, calculated),
    responseSession: buildSessionResponse(sessionId, calculated),
  };
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
  return processStudentSession({
    session,
    student: ctx.student,
    scores: ctx.scores,
    attendances: ctx.attendances,
    roles: ctx.roles,
    sessionComponents: ctx.sessionComponents.filter(
      (component) => !component.sessionId || component.sessionId === sessionId,
    ),
    formulaVersion: ctx.sessionFormulaVersion,
    defaultSessionFormula: ctx.defaultSessionFormula,
  });
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

function buildStudentResponse(
  student: Row,
  grades: StudentSessionResponse[],
  finalGrade: number | null,
): StudentResponse {
  return {
    alunoId: String(student.id),
    nome: String(student.name),
    matricula: student.matricula as string | null,
    sessoes: grades,
    notaFinal: presentGrade(finalGrade),
  };
}
