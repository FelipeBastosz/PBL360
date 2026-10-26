import {
  calculatePeerAssessmentSession,
  calculatePokerPeerSession,
  calculateProblemEvaluationComponent,
  calculateSelfAssessmentSession,
  type EvaluationComponentResult,
  type EvaluationRelease,
} from '../../../domain/entities/evaluation-component-grade';
import {
  presentGrade,
  type GradeAttendance,
  type GradeComponent,
} from '../../../domain/entities/grade-calculator';
import type { GradeRow } from '../../../domain/repositories/grades.repository';
import type { EvaluationComponentResponse } from '../../dtos/grades-response.dto';
import type { SessionGradeResponse, StudentSessionResponse } from './get-problem-grades.helper';

export interface EvaluationComponentContext {
  student: GradeRow;
  attendances: GradeRow[];
  selfScores: GradeRow[];
  peerScores: GradeRow[];
  pokerScores: GradeRow[];
  peerAdjustments?: GradeRow[];
  now: Date;
}

export type PeerGradeSource = 'FORMULARIO' | 'PLANNING_POKER';

export interface SessionEvaluationComponents {
  self: EvaluationComponentResult;
  peer: EvaluationComponentResult;
  peerSource?: PeerGradeSource;
}

export interface StudentEvaluationComponents extends SessionEvaluationComponents {
  sessions: SessionEvaluationComponents[];
}

export function summarizeEvaluationComponents(
  sessions: SessionEvaluationComponents[],
): StudentEvaluationComponents {
  return {
    sessions,
    self: calculateProblemEvaluationComponent(sessions.map((session) => session.self)),
    peer: calculateProblemEvaluationComponent(sessions.map((session) => session.peer)),
  };
}

export function withEvaluationValues(
  components: GradeComponent[],
  evaluations: SessionEvaluationComponents,
): GradeComponent[] {
  return components.map((component) => {
    if (component.type === 'AUTOAVALIACAO') return { ...component, value: evaluations.self.grade };
    if (component.type === 'PARES') return { ...component, value: evaluations.peer.grade };
    return component;
  });
}

export function withSessionEvaluations(
  response: SessionGradeResponse,
  evaluations: SessionEvaluationComponents,
): StudentSessionResponse {
  return {
    ...response,
    autoavaliacao: toEvaluationComponentResponse(evaluations.self),
    pares: {
      ...toEvaluationComponentResponse(evaluations.peer),
      origem: evaluations.peerSource ?? 'FORMULARIO',
    },
  };
}

export const toEvaluationComponentResponse = (
  result: EvaluationComponentResult,
): EvaluationComponentResponse => ({
  nota: presentGrade(result.grade),
  situacao: result.situation,
});

export function calculateSessionComponents(
  ctx: EvaluationComponentContext,
  session: GradeRow,
): SessionEvaluationComponents {
  const belongs = belongsTo(String(session.id), ctx.student.id);
  const attendance = (ctx.attendances.find(belongs)?.status as GradeAttendance) ?? null;
  const shared = { attendance, now: ctx.now };
  return {
    self: calculateSelfAssessmentSession({
      ...shared,
      release: releaseOf(session, 'self'),
      score: numberOrNull(ctx.selfScores.find(belongs)?.score),
    }),
    ...peerComponent(ctx, session, shared),
  };
}

function peerComponent(
  ctx: EvaluationComponentContext,
  session: GradeRow,
  shared: { attendance: GradeAttendance; now: Date },
): Pick<SessionEvaluationComponents, 'peer' | 'peerSource'> {
  const belongs = belongsTo(String(session.id), ctx.student.id);
  if (session.has_poker === true) {
    const finalGrade = numberOrNull(ctx.pokerScores.find(belongs)?.score);
    const peer = calculatePokerPeerSession({ attendance: shared.attendance, finalGrade });
    return { peer, peerSource: 'PLANNING_POKER' };
  }
  const adjustedScore = numberOrNull(ctx.peerAdjustments?.find(belongs)?.score);
  const receivedScores = ctx.peerScores.filter(belongs).map((row) => Number(row.score));
  const release = releaseOf(session, 'peer');
  return {
    peer: calculatePeerAssessmentSession({ ...shared, release, receivedScores, adjustedScore }),
    peerSource: 'FORMULARIO',
  };
}

const belongsTo =
  (sessionId: string, studentId: GradeRow[string]) =>
  (row: GradeRow): boolean =>
    row.session_id === sessionId && row.student_id === studentId;

function releaseOf(session: GradeRow, kind: 'self' | 'peer'): EvaluationRelease {
  const deadline = numberOrNull(session[`${kind}_eval_deadline_ms`]);
  return {
    released: session[`${kind}_eval_released`] === true,
    deadline: deadline === null ? null : new Date(deadline),
  };
}

const numberOrNull = (value: GradeRow[string]): number | null =>
  value === null || value === undefined ? null : Number(value);
