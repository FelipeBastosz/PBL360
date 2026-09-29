export interface NewPerformanceTable {
  tutorId: string;
  name: string;
  criteria: NewPerformanceCriterion[];
}

export interface NewPerformanceCriterion {
  name: string;
  description?: string | null;
  orderIndex?: number;
  weight?: number;
}
