import { Inject, Injectable } from '@nestjs/common';

import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { NotFoundError } from '@/shared/errors/application.error';

import type { ProblemDeletionImpactDto } from '../dtos/problem-deletion-impact.dto';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '../../domain/repositories/problem.repository';

export interface GetProblemDeletionImpactInput {
  roomId: string;
  problemId: string;
  tutorId: string;
}

@Injectable()
export class GetProblemDeletionImpactUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY)
    private readonly problemRepository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: GetProblemDeletionImpactInput): Promise<ProblemDeletionImpactDto> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);

    const problem = await this.problemRepository.findById(input.problemId);

    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundError('Problema não encontrado.');
    }

    // Registros dependentes serão criados nas próximas sprints (sessões, notas, etc.).
    // O retorno inicial é zero com o formato definitivo estabelecido.
    return {
      sessoes: 0,
      notas: 0,
      feedbacks: 0,
      avaliacoes: 0,
    };
  }
}
