import { api } from './api';
import type {
  SessionEvaluationHistoryResponse,
  StudentEvaluationHistoryDetail,
} from '@/types/evaluationHistory';

export const evaluationHistoryService = {
  list: (sessionId: string) =>
    api
      .get<SessionEvaluationHistoryResponse>(`/sessoes/${sessionId}/historico-avaliacoes`)
      .then((r) => r.data),

  detail: (sessionId: string, studentId: string) =>
    api
      .get<StudentEvaluationHistoryDetail>(
        `/sessoes/${sessionId}/historico-avaliacoes/${studentId}`,
      )
      .then((r) => r.data),
};
