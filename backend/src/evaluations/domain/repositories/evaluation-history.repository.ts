import type {
  SessionEvaluationHistoryItem,
  StudentSessionEvaluationComparison,
} from '../entities/evaluation-history.entity';

export const EVALUATION_HISTORY_REPOSITORY = Symbol('EvaluationHistoryRepository');

export interface EvaluationHistoryRepository {
  getHistory(sessionId: string): Promise<SessionEvaluationHistoryItem[]>;
  getStudentComparison(
    sessionId: string,
    studentId: string,
  ): Promise<StudentSessionEvaluationComparison | null>;
  isStudentParticipating(sessionId: string, studentId: string): Promise<boolean>;
}
