import { api } from './api';
import type { SessionEvaluationSummary, ProblemEvaluationCriteria } from '@/types/evaluation';

export const evaluationService = {
  listBySession: (sessionId: string) =>
    api.get<SessionEvaluationSummary[]>(`/sessoes/${sessionId}/avaliacoes`).then((r) => r.data),

  getProblemCriteria: (roomId: string, problemId: string) =>
    api
      .get<ProblemEvaluationCriteria>(`/salas/${roomId}/problemas/${problemId}/criterios`)
      .then((r) => r.data),
};
