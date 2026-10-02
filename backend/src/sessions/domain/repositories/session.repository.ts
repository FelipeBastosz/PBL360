import type { Session } from '../entities/session.entity';

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

export interface SessionDeletionImpact {
  chamada: number;
  papeis: number;
  observacoes: number;
  avaliacoes: number;
  feedbacks: number;
}

export interface SessionRepository {
  create(session: Session): Promise<Session>;
  save(session: Session): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findByProblemId(problemId: string): Promise<Session[]>;
  getDeletionImpact(sessionId: string): Promise<SessionDeletionImpact>;
  delete(id: string, problemId: string): Promise<void>;
}
