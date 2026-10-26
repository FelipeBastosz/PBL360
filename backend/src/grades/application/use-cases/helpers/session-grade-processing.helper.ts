import {
  calculateSessionGrade,
  presentGrade,
  type EvaluationModality,
  type GradeAttendance,
  type GradeComponent,
} from '../../../domain/entities/grade-calculator';
import type { SessionEvaluationComponents } from './evaluation-components.helper';
import {
  filterByStudentAndSession,
  mapCriteriaForSession,
  type Row,
  type SessionGradeResponse,
  type StudentGradeContext,
} from './get-problem-grades.helper';
import { sessionFormulaFor } from './session-formula.helper';

export interface SessionProcessingContext {
  session: Row;
  student: Row;
  criteria: Row[];
  scores: Row[];
  attendances: Row[];
  roles: Row[];
  sessionComponents: GradeComponent[];
  formulaVersion: number;
  defaultSessionFormula: boolean;
  modality?: EvaluationModality;
  modalityScore?: number | null;
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

export function processStudentSession(ctx: SessionProcessingContext) {
  const sessionId = String(ctx.session.id);
  const calculated = calculateSessionForContext(ctx);
  return {
    row: buildSessionRow(ctx, sessionId, calculated),
    responseSession: buildSessionResponse(sessionId, calculated),
  };
}

function calculateSessionForContext(ctx: SessionProcessingContext) {
  const { criteria, attendance, bonus } = extractSessionInputs(ctx);
  return calculateSessionGrade({
    criteria,
    components: ctx.sessionComponents,
    attendance,
    bonus,
    defaultFormula: ctx.defaultSessionFormula,
    modality: ctx.modality,
    modalityScore: ctx.modalityScore,
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
): SessionGradeResponse {
  return {
    sessaoId: sessionId,
    nota: presentGrade(calculated.grade),
    situacao: calculated.situation,
  };
}

function hasTutorEvaluation(scores: Row[], sessionId: string, studentId: unknown): boolean {
  return scores.some(
    (item) =>
      item.session_id === sessionId &&
      item.student_id === studentId &&
      item.score !== null &&
      item.score !== undefined,
  );
}

const isSelfActive = (session: Row, evals?: SessionEvaluationComponents) =>
  session.self_eval_released === true ||
  session.self_eval_deadline_ms != null ||
  (evals?.self.grade !== null && evals?.self.grade !== undefined);

const isPeerActive = (session: Row, evals?: SessionEvaluationComponents) =>
  session.peer_eval_released === true ||
  session.peer_eval_deadline_ms != null ||
  session.has_poker === true ||
  (evals?.peer.grade !== null && evals?.peer.grade !== undefined);

export function resolveSessionModality(
  hasTutorScores: boolean,
  session: Row,
  evaluations?: SessionEvaluationComponents,
): { modality: EvaluationModality; modalityScore: number | null } {
  if (hasTutorScores) return { modality: 'TUTOR', modalityScore: null };
  if (isSelfActive(session, evaluations)) {
    return { modality: 'AUTOAVALIACAO', modalityScore: evaluations?.self.grade ?? null };
  }
  if (isPeerActive(session, evaluations)) {
    return { modality: 'PARES', modalityScore: evaluations?.peer.grade ?? null };
  }
  return { modality: 'TUTOR', modalityScore: null };
}

const buildSessionProcessingContext = (
  ctx: StudentGradeContext,
  session: Row,
  evaluations?: SessionEvaluationComponents,
): SessionProcessingContext => {
  const sessionId = String(session.id);
  const formula = sessionFormulaFor(ctx.sessionFormulas, sessionId);
  const hasTutor = hasTutorEvaluation(ctx.scores, sessionId, ctx.student.id);
  return {
    ...ctx,
    session,
    sessionComponents: formula.components,
    formulaVersion: formula.formulaVersion,
    defaultSessionFormula: formula.defaultFormula,
    ...resolveSessionModality(hasTutor, session, evaluations),
  };
};

export function processStudentSessionForGrade(
  ctx: StudentGradeContext,
  session: Row,
  evaluations?: SessionEvaluationComponents,
) {
  return processStudentSession(buildSessionProcessingContext(ctx, session, evaluations));
}
