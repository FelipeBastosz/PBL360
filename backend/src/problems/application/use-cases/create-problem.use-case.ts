import { Inject, Injectable } from '@nestjs/common';

import { RoomAccessService } from '@/rooms/application/services/room-access.service';

import { Problem } from '../../domain/entities/problem.entity';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '../../domain/repositories/problem.repository';

export interface CreateProblemInput {
  roomId: string;
  authorId: string;
  title: string;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

@Injectable()
export class CreateProblemUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY)
    private readonly problemRepository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: CreateProblemInput): Promise<Problem> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.authorId);

    const problem = Problem.create({
      roomId: input.roomId,
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      createdBy: input.authorId,
    });

    return this.problemRepository.save(problem);
  }
}
