export interface GradeAdjustment {
  criterionId: string;
  previousValue: number;
  newValue: number;
  justification: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
}

export interface ScoreChange {
  itemId: string;
  previousValue: number;
  newValue: number;
}
