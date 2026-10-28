import { api } from './api';
import type {
  SessionEvaluationSummary,
  ProblemEvaluationCriteria,
  TutorEvaluationData,
  SaveTutorEvaluationPayload,
  SessionFeedbackResponse,
  AdjustSelfAssessmentPayload,
  SelfAssessmentAdjustmentResponse,
  SelfAssessmentAdjustmentHistoryResponse,
  SessionEvaluationHistoryResponse,
  SelfAssessmentResponse,
  SaveSelfAssessmentPayload,
  SessionPeersResponse,
  PeerEvaluationResponse,
  SavePeerEvaluationPayload,
  StudentEvaluationSummaryResponse,
} from '@/types/evaluation';

export const evaluationService = {
  listBySession: (sessionId: string) =>
    api.get<SessionEvaluationSummary[]>(`/sessoes/${sessionId}/avaliacoes`).then((r) => r.data),

  getProblemCriteria: (roomId: string, problemId: string) =>
    api
      .get<ProblemEvaluationCriteria>(`/salas/${roomId}/problemas/${problemId}/criterios`)
      .then((r) => r.data),

  getEvaluation: (sessionId: string, studentId: string) =>
    api
      .get<TutorEvaluationData>(`/sessoes/${sessionId}/avaliacoes/${studentId}`)
      .then((r) => r.data),

  saveEvaluation: (sessionId: string, studentId: string, payload: SaveTutorEvaluationPayload) =>
    api
      .put<TutorEvaluationData>(`/sessoes/${sessionId}/avaliacoes/${studentId}`, payload)
      .then((r) => r.data),

  getFeedback: (sessionId: string, studentId: string) =>
    api
      .get<SessionFeedbackResponse | null>(`/sessoes/${sessionId}/alunos/${studentId}/feedback`)
      .then((r) => r.data),

  saveFeedback: (sessionId: string, studentId: string, texto: string) =>
    api
      .put<SessionFeedbackResponse>(`/sessoes/${sessionId}/alunos/${studentId}/feedback`, { texto })
      .then((r) => r.data),

  adjustSelfAssessment: (
    sessionId: string,
    studentId: string,
    payload: AdjustSelfAssessmentPayload,
  ) =>
    api
      .post<SelfAssessmentAdjustmentResponse>(
        `/sessoes/${sessionId}/autoavaliacoes/${studentId}/ajustes`,
        payload,
      )
      .then((r) => r.data),

  getSelfAssessmentAdjustments: (sessionId: string, studentId: string) =>
    api
      .get<SelfAssessmentAdjustmentHistoryResponse>(
        `/sessoes/${sessionId}/autoavaliacoes/${studentId}/ajustes`,
      )
      .then((r) => r.data),

  getEvaluationHistory: (sessionId: string) =>
    api
      .get<SessionEvaluationHistoryResponse>(`/sessoes/${sessionId}/avaliacoes`)
      .then((r) => r.data),

  getMyEvaluationsSummary: (sessionId: string) =>
    api
      .get<StudentEvaluationSummaryResponse>(`/sessoes/${sessionId}/minhas-avaliacoes`)
      .then((r) => r.data),

  getSelfAssessment: (sessionId: string) =>
    api.get<SelfAssessmentResponse>(`/sessoes/${sessionId}/autoavaliacao`).then((r) => r.data),

  saveSelfAssessment: (sessionId: string, payload: SaveSelfAssessmentPayload) =>
    api
      .put<SelfAssessmentResponse>(`/sessoes/${sessionId}/autoavaliacao`, payload)
      .then((r) => r.data),

  listSessionPeers: (sessionId: string) =>
    api.get<SessionPeersResponse>(`/sessoes/${sessionId}/pares`).then((r) => r.data),

  getPeerEvaluation: (sessionId: string, peerId: string) =>
    api.get<PeerEvaluationResponse>(`/sessoes/${sessionId}/pares/${peerId}`).then((r) => r.data),

  savePeerEvaluation: (sessionId: string, peerId: string, payload: SavePeerEvaluationPayload) =>
    api
      .put<PeerEvaluationResponse>(`/sessoes/${sessionId}/pares/${peerId}`, payload)
      .then((r) => r.data),
};
