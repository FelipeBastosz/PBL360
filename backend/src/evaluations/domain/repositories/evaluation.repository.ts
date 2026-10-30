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
  selfEvalReleased?: boolean;
  peerEvalReleased?: boolean;
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
  notaCargo?: number | null;
}
export interface PeerEvaluationSummary {
  alunoId: string;
  nome: string;
  status: EvaluationStatus | null;
}
export interface PeerEvaluationDetail {
  peer: { id: string; name: string };
  config: SessionEvaluationConfig;
  evaluation: Evaluation | null;
}
export interface PeerEvaluationWrite {
  sessionId: string;
  problemId: string;
  evaluatorId: string;
  peerId: string;
  items: CriterionScore[];
  submit: boolean;
  notaCargo?: number | null;
}
export interface StudentEvaluationSummary {
  participating: boolean;
  peerSubmitted: number;
  peerTotal: number;
}
export interface SelfAssessmentWrite {
  context: EvaluationContext;
  studentId: string;
  items: CriterionScore[];
  submit: boolean;
  notaCargo?: number | null;
}
export interface EvaluationRepository {
  getProblemCriteria(problemId: string): Promise<SessionEvaluationConfig>;
  isEnrolled(roomId: string, studentId: string): Promise<boolean>;
  list(context: EvaluationContext): Promise<EvaluationSummary[]>;
  get(context: EvaluationContext, studentId: string): Promise<EvaluationDetail>;
  recordEvaluation(input: EvaluationWrite): Promise<EvaluationDetail>;
  isStudentParticipating(sessionId: string, studentId: string): Promise<boolean>;
  listSessionPeers(sessionId: string, evaluatorId: string): Promise<PeerEvaluationSummary[]>;
  getPeerEvaluation(
    context: EvaluationContext,
    evaluatorId: string,
    peerId: string,
  ): Promise<PeerEvaluationDetail>;
  recordPeerEvaluation(input: PeerEvaluationWrite): Promise<PeerEvaluationDetail>;
  getSelfAssessment(context: EvaluationContext, studentId: string): Promise<EvaluationDetail>;
  getStudentEvaluationSummary(
    context: EvaluationContext,
    studentId: string,
  ): Promise<StudentEvaluationSummary>;
  recordSelfAssessment(input: SelfAssessmentWrite): Promise<EvaluationDetail>;
}
