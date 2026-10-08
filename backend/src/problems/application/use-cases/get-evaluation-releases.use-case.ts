import { Inject, Injectable } from '@nestjs/common';

import { RoomAccessService } from '@/rooms/application/services/room-access.service';

import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '../../domain/repositories/problem.repository';
import {
  findProblemInRoom,
  toEvaluationReleasesOutput,
  type EvaluationReleasesOutput,
} from './helpers/evaluation-releases.helper';

export interface GetEvaluationReleasesInput {
  roomId: string;
  problemId: string;
  tutorId: string;
}

@Injectable()
export class GetEvaluationReleasesUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY)
    private readonly repository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: GetEvaluationReleasesInput): Promise<EvaluationReleasesOutput> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);

    const problem = await findProblemInRoom(this.repository, input.roomId, input.problemId);
    const submissions = await this.repository.countReleaseSubmissions(problem.id, problem.roomId);

    return toEvaluationReleasesOutput(problem, submissions);
  }
}
