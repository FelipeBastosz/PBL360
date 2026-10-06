import type { Evaluation } from '../entities/evaluation.entity';
import type { GradeAdjustment } from '../entities/grade-adjustment.entity';
import type { SessionEvaluationConfig } from '../entities/session-evaluation-config.entity';
import type { CriterionScore } from '../services/evaluation-rules';
import type { EvaluationStatus } from '../enums/evaluation-status.enum';

export const EVALUATION_REPOSITORY = Symbol('EvaluationRepository');
export interface EvaluationContext {
  sessionId: string;
  problemId: string;
  roomId: string;
}
export interface EvaluationDetail {
  config: SessionEvaluationConfig;
  evaluation: Evaluation | null;
  adjustments: GradeAdjustment[];
}
export interface EvaluationSummary {
  studentId: string;
  name: string;
  status: EvaluationStatus | null;
  sessionScore: number | null;
}
export interface EvaluationWrite {
  context: EvaluationContext;
  studentId: string;
  authorId: string;
  items: CriterionScore[];
  submit: boolean;
  justification?: string;
}
export interface EvaluationRepository {
  getProblemCriteria(problemId: string): Promise<SessionEvaluationConfig>;
  isEnrolled(roomId: string, studentId: string): Promise<boolean>;
  list(context: EvaluationContext): Promise<EvaluationSummary[]>;
  get(context: EvaluationContext, studentId: string): Promise<EvaluationDetail>;
  recordEvaluation(input: EvaluationWrite): Promise<EvaluationDetail>;
}
