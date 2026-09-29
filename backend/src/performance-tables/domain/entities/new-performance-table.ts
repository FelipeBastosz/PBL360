export interface NewPerformanceTable {
  tutorId: string;
  name: string;
  description?: string | null;
  criteria: NewPerformanceCriterion[];
}

export interface NewPerformanceCriterion {
  name: string;
  description?: string | null;
  orderIndex?: number;
  weight?: number;
}
