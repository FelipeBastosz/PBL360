import type { EvaluationAdjustment } from '../entities/grade-adjustment.entity';
import type { EvaluationStatus } from '../enums/evaluation-status.enum';

export const SELF_ASSESSMENT_ADJUSTMENT_REPOSITORY = Symbol('SelfAssessmentAdjustmentRepository');

export interface SelfAssessmentAdjustmentHistory {
  evaluationId?: string;
  pokerRoundId?: string;
  sessionId?: string;
  studentId?: string;
  status: EvaluationStatus;
  originalScore: number | null;
  adjustments: EvaluationAdjustment[];
  tipo?: 'AUTOAVALIACAO' | 'PARES';
}

export interface SelfAssessmentAdjustmentWrite {
  sessionId: string;
  studentId: string;
  authorId: string;
  newScore: number;
  justification: string;
  tipo?: 'AUTOAVALIACAO' | 'PARES';
}

export interface RecordedSelfAssessmentAdjustment {
  originalScore: number;
  adjustment: EvaluationAdjustment;
}

export interface SelfAssessmentAdjustmentRepository {
  findHistory(
    sessionId: string,
    studentId: string,
    tipo?: 'AUTOAVALIACAO' | 'PARES',
  ): Promise<SelfAssessmentAdjustmentHistory | null>;
  record(input: SelfAssessmentAdjustmentWrite): Promise<RecordedSelfAssessmentAdjustment>;
}
