import type { PerformanceTable } from '../entities/performance-table.entity';

export const PERFORMANCE_TABLE_REPOSITORY = Symbol('PERFORMANCE_TABLE_REPOSITORY');

export interface PerformanceTableRepository {
  create(table: PerformanceTable): Promise<PerformanceTable>;

  findById(id: string): Promise<PerformanceTable | null>;

  softDelete(table: PerformanceTable): Promise<boolean>;
}
