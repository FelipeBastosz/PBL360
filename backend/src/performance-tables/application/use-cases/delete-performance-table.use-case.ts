import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import {
  PERFORMANCE_TABLE_REPOSITORY,
  type PerformanceTableRepository,
} from '../../domain/repositories/performance-table.repository';

export interface DeletePerformanceTableInput {
  tableId: string;
  tutorId: string;
}

@Injectable()
export class DeletePerformanceTableUseCase {
  constructor(
    @Inject(PERFORMANCE_TABLE_REPOSITORY)
    private readonly performanceTableRepository: PerformanceTableRepository,
  ) {}

  async execute({ tableId, tutorId }: DeletePerformanceTableInput): Promise<void> {
    const table = await this.performanceTableRepository.findById(tableId);
    if (!table) throw new NotFoundError('Tabela de desempenho não encontrada.');
    if (table.tutorId !== tutorId) {
      throw new ForbiddenError('Apenas o professor responsável pode excluir esta tabela.');
    }

    table.delete();
    const deleted = await this.performanceTableRepository.softDelete(table);
    if (!deleted) throw new NotFoundError('Tabela de desempenho não encontrada.');
  }
}
