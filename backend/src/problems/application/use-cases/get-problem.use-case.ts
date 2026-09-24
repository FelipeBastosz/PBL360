import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { RoomAccessService } from '@/rooms/application/services/room-access.service';

import type { Problem } from '../../domain/entities/problem.entity';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '../../domain/repositories/problem.repository';

export interface GetProblemInput {
  roomId: string;
  problemId: string;
  tutorId: string;
}

@Injectable()
export class GetProblemUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY)
    private readonly problemRepository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: GetProblemInput): Promise<Problem> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);

    const problem = await this.problemRepository.findById(input.problemId);

    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundException('Problema não encontrado.');
    }

    return problem;
  }
}
