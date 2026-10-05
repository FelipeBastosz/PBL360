import { Inject, Injectable } from '@nestjs/common';

import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { ConflictError, NotFoundError } from '@/shared/errors/application.error';

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

    await this.assertTableChangeAllowed(problem, input.dto.tabelaId);
    return this.repository.updateDetails({
      id: problem.id,
      roomId: input.roomId,
      authorId: input.tutorId,
      title: input.dto.title.trim(),
      tableId: input.dto.tabelaId,
    });
  }
  private async assertTableChangeAllowed(problem: Problem, tableId?: string | null): Promise<void> {
    if (tableId === undefined || tableId === problem.performanceTableId) return;
    if (await this.repository.hasEvaluations(problem.id)) {
      throw new ConflictError(
        'A tabela não pode ser alterada após a primeira avaliação do problema.',
      );
    }
  }
}

export interface UpdateProblemInput {
  roomId: string;
  problemId: string;
  tutorId: string;
  dto: UpdateProblemDto;
}
