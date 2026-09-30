import { Inject, Injectable } from '@nestjs/common';
import type { NewPerformanceCriterion } from '../../domain/entities/new-performance-table';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import {
  PERFORMANCE_TABLE_REPOSITORY,
  type PerformanceTableRepository,
} from '../../domain/repositories/performance-table.repository';

export interface CreatePerformanceTableInput {
  tutorId: string;
  name: string;
  description?: string | null;
  criteria: NewPerformanceCriterion[];
}

@Injectable()
export class CreatePerformanceTableUseCase {
  constructor(
    @Inject(PERFORMANCE_TABLE_REPOSITORY)
    private readonly performanceTableRepository: PerformanceTableRepository,
  ) {}

  async execute(input: CreatePerformanceTableInput): Promise<PerformanceTable> {
    const table = PerformanceTable.create(input);

    return this.performanceTableRepository.create(table);
  }
}
