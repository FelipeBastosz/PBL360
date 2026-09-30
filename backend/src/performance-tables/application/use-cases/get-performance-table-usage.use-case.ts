import { Inject, Injectable } from '@nestjs/common';

import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';

import {
  PERFORMANCE_TABLE_REPOSITORY,
  type PerformanceTableRepository,
} from '../../domain/repositories/performance-table.repository';

export interface GetPerformanceTableUsageInput {
  tableId: string;
  tutorId: string;
}

export interface GetPerformanceTableUsageOutput {
  inUse: boolean;
  problemCount: number;
}

@Injectable()
export class GetPerformanceTableUsageUseCase {
  constructor(
    @Inject(PERFORMANCE_TABLE_REPOSITORY)
    private readonly performanceTableRepository: PerformanceTableRepository,
  ) {}

  async execute(input: GetPerformanceTableUsageInput): Promise<GetPerformanceTableUsageOutput> {
    await this.validateAccess(input);

    const usage = await this.performanceTableRepository.findUsageById(input.tableId);

    return this.toOutput(usage.problemCount);
  }

  private async validateAccess(input: GetPerformanceTableUsageInput): Promise<void> {
    const table = await this.performanceTableRepository.findById(input.tableId);

    if (!table) {
      throw new NotFoundError('Tabela de desempenho não encontrada.');
    }

    if (table.tutorId !== input.tutorId) {
      throw new ForbiddenError('Você não tem permissão para acessar esta tabela de desempenho.');
    }
  }

  private toOutput(problemCount: number): GetPerformanceTableUsageOutput {
    return {
      inUse: problemCount > 0,
      problemCount,
    };
  }
}
