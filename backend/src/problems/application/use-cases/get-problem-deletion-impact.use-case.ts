import { Inject, Injectable } from '@nestjs/common';

import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { NotFoundError } from '@/shared/errors/application.error';

import {
  PROBLEM_REPOSITORY,
  type ProblemDeletionImpact,
  type ProblemRepository,
} from '../../domain/repositories/problem.repository';

export interface GetProblemDeletionImpactInput {
  roomId: string;
  problemId: string;
  tutorId: string;
}

export type GetProblemDeletionImpactOutput = ProblemDeletionImpact;

@Injectable()
export class GetProblemDeletionImpactUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY)
    private readonly problemRepository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: GetProblemDeletionImpactInput): Promise<GetProblemDeletionImpactOutput> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);

    const problem = await this.problemRepository.findById(input.problemId);

    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundError('Problema não encontrado.');
    }

    return this.problemRepository.getDeletionImpact(problem.id);
  }
}
