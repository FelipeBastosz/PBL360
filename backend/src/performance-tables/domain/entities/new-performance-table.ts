export interface NewPerformanceTable {
  tutorId: string;
  roomId?: string | null;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  criteria: NewPerformanceCriterion[];
}

export interface NewPerformanceCriterion {
  name: string;
  description?: string | null;
  orderIndex?: number;
  weight?: number;
  maxScore?: number;
}
