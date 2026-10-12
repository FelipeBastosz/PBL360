import { Inject, Injectable, Optional } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
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
    @Optional()
    private readonly roomAccessService?: RoomAccessService,
  ) {}

  async execute(input: GetPerformanceTableInput): Promise<PerformanceTable> {
    const table = await this.performanceTableRepository.findById(input.tableId);

    if (!table) {
      throw new NotFoundError('Tabela de desempenho não encontrada.');
    }

    if (table.tutorId !== input.tutorId) {
      if (table.isDefault) {
        return table;
      }

      if (table.roomId && this.roomAccessService) {
        await this.roomAccessService.assertTutorCanAccessRoom(table.roomId, input.tutorId);
        return table;
      }

      throw new ForbiddenError('Você não tem permissão para acessar esta tabela de desempenho.');
    }

    const usage = await this.performanceTableRepository.findUsageById(table.id);
    table.sessionCount = usage.sessionCount ?? 0;
    table.pastSessionCount = usage.pastSessionCount ?? 0;

    return table;
  }
}
