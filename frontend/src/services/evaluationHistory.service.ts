import { api } from './api';
import type { SessionEvaluationHistoryResponse } from '@/types/evaluationHistory';

export const evaluationHistoryService = {
  list: (sessionId: string) =>
    api
      .get<SessionEvaluationHistoryResponse>(`/sessoes/${sessionId}/historico-avaliacoes`)
      .then((r) => r.data),
};
