import type { EvaluationAdjustment } from '../entities/grade-adjustment.entity';
import type { EvaluationStatus } from '../enums/evaluation-status.enum';

export const SELF_ASSESSMENT_ADJUSTMENT_REPOSITORY = Symbol('SelfAssessmentAdjustmentRepository');

export interface SelfAssessmentAdjustmentHistory {
  evaluationId: string;
  status: EvaluationStatus;
  originalScore: number | null;
  adjustments: EvaluationAdjustment[];
}

export interface SelfAssessmentAdjustmentWrite {
  sessionId: string;
  studentId: string;
  authorId: string;
  newScore: number;
  justification: string;
}

export interface RecordedSelfAssessmentAdjustment {
  originalScore: number;
  adjustment: EvaluationAdjustment;
}

export interface SelfAssessmentAdjustmentRepository {
  findHistory(
    sessionId: string,
    studentId: string,
  ): Promise<SelfAssessmentAdjustmentHistory | null>;
  record(input: SelfAssessmentAdjustmentWrite): Promise<RecordedSelfAssessmentAdjustment>;
}
