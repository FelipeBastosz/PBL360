import type { CriterionCategory } from '../enums/criterion-category.enum';

export interface NewPerformanceTable {
  tutorId: string;
  name: string;
  description?: string | null;
  criteria: NewPerformanceCriterion[];
}

export interface NewPerformanceCriterion {
  name: string;
  description?: string | null;
  category?: CriterionCategory;
  orderIndex?: number;
  weight?: number;
  maxScore?: number;
}
