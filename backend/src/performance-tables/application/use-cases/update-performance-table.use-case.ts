import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { UpdatePerformanceTable } from '../../domain/entities/update-performance-table';
import type { PerformanceTable } from '../../domain/entities/performance-table.entity';
import {
  PERFORMANCE_TABLE_REPOSITORY,
  type PerformanceTableRepository,
} from '../../domain/repositories/performance-table.repository';

@Injectable()
export class UpdatePerformanceTableUseCase {
  constructor(
    @Inject(PERFORMANCE_TABLE_REPOSITORY)
    private readonly performanceTableRepository: PerformanceTableRepository,
  ) {}

  async execute(
    tableId: string,
    tutorId: string,
    input: UpdatePerformanceTable,
  ): Promise<PerformanceTable> {
    const table = await this.performanceTableRepository.findById(tableId);

    if (!table) {
      throw new NotFoundError('Tabela de desempenho não encontrada.');
    }

    if (table.tutorId !== tutorId) {
      throw new ForbiddenError('Apenas o professor responsável pode editar esta tabela.');
    }

    table.update(input);

    return this.performanceTableRepository.update(table);
  }
}
