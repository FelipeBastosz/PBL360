export interface EvaluationAdjustment {
  previousValue: number;
  newValue: number;
  justification: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
}

export interface GradeAdjustment extends EvaluationAdjustment {
  criterionId: string;
}

export interface ScoreChange {
  itemId: string;
  previousValue: number;
  newValue: number;
}
