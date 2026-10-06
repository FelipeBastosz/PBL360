import { Inject, Injectable } from '@nestjs/common';
import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import { PROBLEM_REPOSITORY } from '../../domain/repositories/problem.repository';
import type { ProblemRepository } from '../../domain/repositories/problem.repository';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { PERFORMANCE_TABLE_REPOSITORY } from '@/performance-tables/domain/repositories/performance-table.repository';
import type { PerformanceTableRepository } from '@/performance-tables/domain/repositories/performance-table.repository';

export interface ChangeProblemPerformanceTableInput {
  roomId: string;
  problemId: string;
  tutorId: string;
  performanceTableId: string;
}

export interface ChangeProblemPerformanceTableOutput {
  problemId: string;
  table: { id: string; name: string };
}

@Injectable()
export class ChangeProblemPerformanceTableUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY) private readonly problems: ProblemRepository,
    @Inject(PERFORMANCE_TABLE_REPOSITORY)
    private readonly performanceTables: PerformanceTableRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(
    input: ChangeProblemPerformanceTableInput,
  ): Promise<ChangeProblemPerformanceTableOutput> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);

    const problem = await this.validateProblem(input);
    const table = await this.validateTable(input);

    problem.performanceTableId = table.id;
    problem.updatedBy = input.tutorId;

    await this.problems.save(problem);

    return {
      problemId: problem.id,
      table: { id: table.id, name: table.name },
    };
  }

  private async validateProblem(input: ChangeProblemPerformanceTableInput) {
    const problem = await this.problems.findById(input.problemId);
    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundError('Problema não encontrado na sala informada.');
    }
    const hasSessions = await this.problems.hasSessions(input.problemId);
    if (hasSessions) {
      throw new ConflictError(
        'Não é possível alterar a tabela de um problema que já possui avaliações.',
      );
    }
    return problem;
  }

  private async validateTable(input: ChangeProblemPerformanceTableInput) {
    const table = await this.performanceTables.findById(input.performanceTableId);
    if (!table || table.deletedAt) {
      throw new UnprocessableEntityError(
        'A tabela de desempenho informada é inválida ou está inativa.',
      );
    }

    try {
      await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, table.tutorId);
    } catch {
      throw new UnprocessableEntityError('A tabela pertence a um professor que não está na sala.');
    }
    return table;
  }
}
