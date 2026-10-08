import { NotFoundError } from '@/shared/errors/application.error';

import type { Problem } from '../../../domain/entities/problem.entity';
import type {
  ProblemRepository,
  ReleaseSubmissions,
} from '../../../domain/repositories/problem.repository';

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

export const findProblemInRoom = async (
  repository: ProblemRepository,
  roomId: string,
  problemId: string,
): Promise<Problem> => {
  const problem = await repository.findById(problemId);
  if (!problem || problem.roomId !== roomId) {
    throw new NotFoundError('Problema não encontrado.');
  }
  return problem;
};

const toStatus = (
  released: boolean,
  deadline: Date | null | undefined,
  submitted: number,
  expected: number,
): EvaluationReleaseStatus => ({ released, deadline: deadline ?? null, submitted, expected });

export const toEvaluationReleasesOutput = (
  problem: Problem,
  { students, selfSubmitted, peerSubmitted }: ReleaseSubmissions,
): EvaluationReleasesOutput => ({
  self: toStatus(problem.selfEvalReleased, problem.selfEvalDeadline, selfSubmitted, students),
  peer: toStatus(
    problem.peerEvalReleased,
    problem.peerEvalDeadline,
    peerSubmitted,
    // Each student evaluates every classmate.
    students > 1 ? students * (students - 1) : 0,
  ),
  updatedAt: problem.releasedAt ?? null,
  updatedBy: problem.releasedBy ?? null,
});
