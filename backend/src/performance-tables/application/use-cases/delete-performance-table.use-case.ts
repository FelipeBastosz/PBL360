import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
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

    const usage = await this.performanceTableRepository.findUsageById(tableId);
    if (usage && (usage.problemCount > 0 || (usage.sessionCount ?? 0) > 0)) {
      throw new ConflictError('A tabela de desempenho já foi utilizada e não pode ser excluída.');
    }

    table.delete();
    const deleted = await this.performanceTableRepository.softDelete(table);
    if (!deleted) throw new NotFoundError('Tabela de desempenho não encontrada.');
  }
}
