import { ForbiddenError } from '@/shared/errors/application.error';
import { SYSTEM_TABLE_READ_ONLY } from '../../domain/entities/system-performance-tables';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { NewPerformanceCriterion } from '../../domain/entities/new-performance-table';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import {
  PERFORMANCE_TABLE_REPOSITORY,
  type PerformanceTableRepository,
} from '../../domain/repositories/performance-table.repository';

export interface CreatePerformanceTableInput {
  tutorId: string;
  roomId?: string | null;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  criteria: NewPerformanceCriterion[];
}

@Injectable()
export class CreatePerformanceTableUseCase {
  constructor(
    @Inject(PERFORMANCE_TABLE_REPOSITORY)
    private readonly performanceTableRepository: PerformanceTableRepository,
    @Optional()
    private readonly roomAccessService?: RoomAccessService,
  ) {}

  async execute(input: CreatePerformanceTableInput): Promise<PerformanceTable> {
    if (input.isDefault) throw new ForbiddenError(SYSTEM_TABLE_READ_ONLY);
    if (input.roomId && this.roomAccessService) {
      await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);
    }

    const table = PerformanceTable.create(input);

    return this.performanceTableRepository.create(table);
  }
}
