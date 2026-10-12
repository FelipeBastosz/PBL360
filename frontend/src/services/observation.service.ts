import { api } from './api';
import type {
  BehaviorTag,
  ObservationItem,
  RegisterObservationPayload,
  StudentObservationsResponse,
} from '@/types/observation';

export const observationService = {
  listTags: () => api.get<BehaviorTag[]>('/marcacoes').then((r) => r.data),

  createTag: (nome: string) => api.post<BehaviorTag>('/marcacoes', { nome }).then((r) => r.data),

  listStudentObservations: (sessionId: string, studentId: string) =>
    api
      .get<StudentObservationsResponse>(`/sessoes/${sessionId}/alunos/${studentId}/observacoes`)
      .then((r) => r.data),

  registerObservation: (
    sessionId: string,
    studentId: string,
    payload: RegisterObservationPayload,
  ) =>
    api
      .post<ObservationItem>(`/sessoes/${sessionId}/alunos/${studentId}/observacoes`, payload)
      .then((r) => r.data),

  undoObservation: (observationId: string) =>
    api.delete<void>(`/observacoes/${observationId}`).then(() => undefined),

  complementObservation: (observationId: string, texto: string) =>
    api.patch<ObservationItem>(`/observacoes/${observationId}`, { texto }).then((r) => r.data),
};
