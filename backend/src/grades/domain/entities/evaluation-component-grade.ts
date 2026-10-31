import type { GradeAttendance } from './grade-calculator';

export type EvaluationComponentSituation =
  | 'AVALIADA'
  | 'PENDENTE'
  | 'NAO_ENVIADA'
  | 'AUSENTE'
  | 'JUSTIFICADA'
  | 'NAO_LIBERADA'
  | 'SEM_AVALIACOES';

export interface EvaluationRelease {
  released: boolean;
  deadline: Date | null;
}

export interface EvaluationComponentResult {
  grade: number | null;
  situation: EvaluationComponentSituation;
}

export interface SelfAssessmentSessionInput {
  attendance: GradeAttendance;
  release: EvaluationRelease;
  score: number | null;
  now: Date;
}

export interface PokerPeerSessionInput {
  attendance: GradeAttendance;
  finalGrade: number | null;
}

export interface PeerAssessmentSessionInput {
  attendance: GradeAttendance;
  release: EvaluationRelease;
  receivedScores: number[];
  now: Date;
  adjustedScore?: number | null;
}

const isOpen = (release: EvaluationRelease, now: Date): boolean =>
  release.released && (release.deadline === null || release.deadline > now);

const wasNeverReleased = (release: EvaluationRelease): boolean =>
  !release.released && release.deadline === null;

const withoutData = (situation: EvaluationComponentSituation): EvaluationComponentResult => ({
  grade: null,
  situation,
});

function excludedByAttendance(attendance: GradeAttendance): EvaluationComponentResult | null {
  if (attendance === 'ABSENT') return withoutData('AUSENTE');
  if (attendance === 'EXCUSED') return withoutData('JUSTIFICADA');
  return null;
}

export function calculateSelfAssessmentSession(
  input: SelfAssessmentSessionInput,
): EvaluationComponentResult {
  const excluded = excludedByAttendance(input.attendance);
  if (excluded) return excluded;
  if (input.score !== null) return { grade: input.score, situation: 'AVALIADA' };
  if (wasNeverReleased(input.release)) return withoutData('NAO_LIBERADA');
  if (isOpen(input.release, input.now) || input.attendance === null) {
    return withoutData('PENDENTE');
  }
  return { grade: 0, situation: 'NAO_ENVIADA' };
}

export function calculatePeerAssessmentSession(
  input: PeerAssessmentSessionInput,
): EvaluationComponentResult {
  const excluded = excludedByAttendance(input.attendance);
  if (excluded) return excluded;
  if (input.adjustedScore !== undefined && input.adjustedScore !== null) {
    return { grade: input.adjustedScore, situation: 'AVALIADA' };
  }
  if (isOpen(input.release, input.now)) return withoutData('PENDENTE');
  const average = averageOf(input.receivedScores);
  if (average !== null) return { grade: average, situation: 'AVALIADA' };
  if (wasNeverReleased(input.release)) return withoutData('NAO_LIBERADA');
  return withoutData('SEM_AVALIACOES');
}

export function calculatePokerPeerSession(input: PokerPeerSessionInput): EvaluationComponentResult {
  const excluded = excludedByAttendance(input.attendance);
  if (excluded) return excluded;
  if (input.finalGrade === null) return withoutData('SEM_AVALIACOES');
  return { grade: input.finalGrade, situation: 'AVALIADA' };
}

export function calculateProblemEvaluationComponent(
  sessions: EvaluationComponentResult[],
): EvaluationComponentResult {
  const grade = averageOf(
    sessions.flatMap((session) => (session.grade === null ? [] : [session.grade])),
  );
  return grade === null ? withoutData('PENDENTE') : { grade, situation: 'AVALIADA' };
}

function averageOf(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
