import { Inject, Injectable } from '@nestjs/common';

import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { NotFoundError } from '@/shared/errors/application.error';

import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '../../domain/repositories/problem.repository';

export interface DeleteProblemInput {
  roomId: string;
  problemId: string;
  tutorId: string;
}

@Injectable()
export class DeleteProblemUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY)
    private readonly problemRepository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: DeleteProblemInput): Promise<void> {
    // US08: Apenas o professor responsável pela sala pode excluir
    await this.roomAccessService.assertTutorIsRoomOwner(input.roomId, input.tutorId);

    const problem = await this.problemRepository.findById(input.problemId);

    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundError('Problema não encontrado.');
    }

    await this.problemRepository.delete(problem.id, input.roomId);
  }
}
