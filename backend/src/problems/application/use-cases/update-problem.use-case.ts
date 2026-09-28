import { Inject, Injectable } from '@nestjs/common';

import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { NotFoundError } from '@/shared/errors/application.error';

import {
  PROBLEM_REPOSITORY,
  ProblemRepository,
} from '../../domain/repositories/problem.repository';
import { UpdateProblemDto } from '../dtos/update-problem.dto';
import { Problem } from '../../domain/entities/problem.entity';

@Injectable()
export class UpdateProblemUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY)
    private readonly repository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: UpdateProblemInput): Promise<Problem> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);

    const problem = await this.repository.findById(input.problemId);
    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundError('Problema não encontrado.');
    }

    problem.title = input.dto.title.trim();
    return this.repository.save(problem);
  }
}

export interface UpdateProblemInput {
  roomId: string;
  problemId: string;
  tutorId: string;
  dto: UpdateProblemDto;
}
