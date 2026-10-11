import type { NewPerformanceCriterion } from './new-performance-table';

export interface UpdatePerformanceCriterion extends NewPerformanceCriterion {
  id?: string;
}

export interface UpdatePerformanceTable {
  propagateToSessions?: boolean;
  name: string;
  description?: string | null;
  criteria: UpdatePerformanceCriterion[];
}
