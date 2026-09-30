import type { PerformanceTable } from '../entities/performance-table.entity';

export const PERFORMANCE_TABLE_REPOSITORY = Symbol('PERFORMANCE_TABLE_REPOSITORY');

export interface PerformanceTableSummary {
  id: string;
  tutorId: string;
  name: string;
  description: string | null;
  criteriaCount: number;
  problemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceTableRepository {
  create(table: PerformanceTable): Promise<PerformanceTable>;

  findSummariesByTutorId(tutorId: string): Promise<PerformanceTableSummary[]>;

  findById(id: string): Promise<PerformanceTable | null>;
  softDelete(table: PerformanceTable): Promise<boolean>;
}
