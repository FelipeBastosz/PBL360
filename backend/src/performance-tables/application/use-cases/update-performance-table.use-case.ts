import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { UpdatePerformanceTable } from '../../domain/entities/update-performance-table';
import type { PerformanceTable } from '../../domain/entities/performance-table.entity';
import {
  PERFORMANCE_TABLE_REPOSITORY,
  type PerformanceTableRepository,
} from '../../domain/repositories/performance-table.repository';

export interface UpdatePerformanceTableInput {
  tableId: string;
  tutorId: string;
  changes: UpdatePerformanceTable;
}

@Injectable()
export class UpdatePerformanceTableUseCase {
  constructor(
    @Inject(PERFORMANCE_TABLE_REPOSITORY)
    private readonly performanceTableRepository: PerformanceTableRepository,
  ) {}

  async execute({
    tableId,
    tutorId,
    changes: input,
  }: UpdatePerformanceTableInput): Promise<PerformanceTable> {
    const table = await this.performanceTableRepository.findById(tableId);

    if (!table) {
      throw new NotFoundError('Tabela de desempenho não encontrada.');
    }

    if (table.tutorId !== tutorId) {
      throw new ForbiddenError('Apenas o professor responsável pode editar esta tabela.');
    }

    return this.updateTable(table, input);
  }

  private async updateTable(
    table: PerformanceTable,
    input: UpdatePerformanceTable,
  ): Promise<PerformanceTable> {
    const usage = await this.performanceTableRepository.findUsageById(table.id);
    table.update(input, (usage.pastSessionCount ?? 0) > 0);

    const updated = await this.performanceTableRepository.update(
      table,
      input.propagateToSessions ?? false,
    );
    updated.sessionCount = usage.sessionCount ?? 0;
    updated.pastSessionCount = usage.pastSessionCount ?? 0;
    return updated;
  }
}
