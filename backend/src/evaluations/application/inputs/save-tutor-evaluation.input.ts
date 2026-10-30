export interface EvaluationItemInput {
  criterionId: string;
  score: number;
}

export interface SaveTutorEvaluationInput {
  sessionId: string;
  studentId: string;
  authorId: string;
  items: EvaluationItemInput[];
  submit: boolean;
  justification?: string;
  notaCargo?: number | null;
}
