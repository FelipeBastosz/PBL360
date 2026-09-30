import { Inject, Injectable } from '@nestjs/common';
import {
  PERFORMANCE_TABLE_REPOSITORY,
  type PerformanceTableRepository,
  type PerformanceTableSummary,
} from '../../domain/repositories/performance-table.repository';

@Injectable()
export class ListPerformanceTablesUseCase {
  constructor(
    @Inject(PERFORMANCE_TABLE_REPOSITORY)
    private readonly performanceTableRepository: PerformanceTableRepository,
  ) {}

  execute(tutorId: string): Promise<PerformanceTableSummary[]> {
    return this.performanceTableRepository.findSummariesByTutorId(tutorId);
  }
}
