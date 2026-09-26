import type { PerformanceTable } from '../entities/performance-table.entity';

export const PERFORMANCE_TABLE_REPOSITORY = Symbol('PERFORMANCE_TABLE_REPOSITORY');

export interface PerformanceTableRepository {
  create(table: PerformanceTable): Promise<PerformanceTable>;
}
