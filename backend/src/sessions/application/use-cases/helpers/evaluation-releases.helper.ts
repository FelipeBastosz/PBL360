import type { Session } from '../../../domain/entities/session.entity';
import type { ReleaseSubmissions } from '../../../domain/repositories/session.repository';

export interface EvaluationReleaseStatus {
  released: boolean;
  deadline: Date | null;
  submitted: number;
  expected: number;
}

export interface EvaluationReleasesOutput {
  self: EvaluationReleaseStatus;
  peer: EvaluationReleaseStatus;
  updatedAt: Date | null;
  updatedBy: string | null;
}

const toStatus = (
  released: boolean,
  deadline: Date | null,
  submitted: number,
  expected: number,
): EvaluationReleaseStatus => ({ released, deadline, submitted, expected });

export const toEvaluationReleasesOutput = (
  session: Session,
  { presentStudents, selfSubmitted, peerSubmitted }: ReleaseSubmissions,
): EvaluationReleasesOutput => ({
  self: toStatus(
    session.selfEvalReleased,
    session.selfEvalDeadline,
    selfSubmitted,
    presentStudents,
  ),
  peer: toStatus(
    session.peerEvalReleased,
    session.peerEvalDeadline,
    peerSubmitted,
    // Each present student evaluates every present classmate.
    presentStudents > 1 ? presentStudents * (presentStudents - 1) : 0,
  ),
  updatedAt: session.releasedAt,
  updatedBy: session.releasedBy,
});
