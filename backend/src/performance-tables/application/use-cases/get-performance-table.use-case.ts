import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { PerformanceTable } from '../../domain/entities/performance-table.entity';
import {
  PERFORMANCE_TABLE_REPOSITORY,
  type PerformanceTableRepository,
} from '../../domain/repositories/performance-table.repository';

export interface GetPerformanceTableInput {
  tableId: string;
  tutorId: string;
}

@Injectable()
export class GetPerformanceTableUseCase {
  constructor(
    @Inject(PERFORMANCE_TABLE_REPOSITORY)
    private readonly performanceTableRepository: PerformanceTableRepository,
  ) {}

  async execute(input: GetPerformanceTableInput): Promise<PerformanceTable> {
    const table = await this.performanceTableRepository.findById(input.tableId);

    if (!table) {
      throw new NotFoundError('Tabela de desempenho não encontrada.');
    }

    if (table.tutorId !== input.tutorId) {
      throw new ForbiddenError('Você não tem permissão para acessar esta tabela de desempenho.');
    }

    const usage = await this.performanceTableRepository.findUsageById(table.id);
    table.sessionCount = usage.sessionCount ?? 0;
    table.pastSessionCount = usage.pastSessionCount ?? 0;

    return table;
  }
}
