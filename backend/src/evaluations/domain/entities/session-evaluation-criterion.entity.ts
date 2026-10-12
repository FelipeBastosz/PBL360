export interface SessionEvaluationCriterion {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  maxScore?: number;
  orderIndex: number;
}
