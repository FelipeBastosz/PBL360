import type { NewPerformanceCriterion } from './new-performance-table';

export interface UpdatePerformanceTable {
  name: string;
  description?: string | null;
  criteria: NewPerformanceCriterion[];
}
