import type { SessionGeneralEvaluation } from '../entities/session-general-evaluation.entity';

export const SESSION_GENERAL_EVALUATION_REPOSITORY = Symbol(
  'SESSION_GENERAL_EVALUATION_REPOSITORY',
);

export interface SessionGeneralEvaluationRecord extends SessionGeneralEvaluation {
  author: { id: string; name: string };
}

export interface SessionGeneralEvaluationRepository {
  findBySessionId(sessionId: string): Promise<SessionGeneralEvaluationRecord[]>;
  save(sessionId: string, text: string, tutorId: string): Promise<SessionGeneralEvaluationRecord>;
  deleteBySessionAndTutor(sessionId: string, tutorId: string): Promise<void>;
}
