import { Inject, Injectable, Optional } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
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
    @Optional()
    private readonly roomAccessService?: RoomAccessService,
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
      if (table.roomId && this.roomAccessService) {
        await this.roomAccessService.assertTutorCanAccessRoom(table.roomId, tutorId);
      } else {
        throw new ForbiddenError('Apenas o professor responsável pode editar esta tabela.');
      }
    }

    table.update(input);

    return this.performanceTableRepository.update(table);
  }
}
