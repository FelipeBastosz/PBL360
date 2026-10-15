import { api } from './api';
import type {
  ProblemFeedbacksResponse,
  StudentProblemFeedbackResponse,
  GeneralFeedbackResponse,
  SaveStudentFeedbackPayload,
  SaveGeneralFeedbackPayload,
  ReceivedFeedbackResponse,
  ReceivedProblemFeedbacksResponse,
} from '@/types/feedback';

export const feedbackService = {
  getProblemFeedbacks: (roomId: string, problemId: string): Promise<ProblemFeedbacksResponse> =>
    api
      .get<ProblemFeedbacksResponse>(`/salas/${roomId}/problemas/${problemId}/feedbacks`)
      .then((r) => r.data),

  saveStudentFeedback: (
    roomId: string,
    problemId: string,
    alunoId: string,
    payload: SaveStudentFeedbackPayload,
  ): Promise<StudentProblemFeedbackResponse> =>
    api
      .put<StudentProblemFeedbackResponse>(
        `/salas/${roomId}/problemas/${problemId}/feedbacks/alunos/${alunoId}`,
        payload,
      )
      .then((r) => r.data),

  saveGeneralFeedback: (
    roomId: string,
    problemId: string,
    payload: SaveGeneralFeedbackPayload,
  ): Promise<GeneralFeedbackResponse> =>
    api
      .put<GeneralFeedbackResponse>(
        `/salas/${roomId}/problemas/${problemId}/feedbacks/geral`,
        payload,
      )
      .then((r) => r.data),

  getMySessionFeedback: (sessionId: string): Promise<ReceivedFeedbackResponse | null> =>
    api
      .get<ReceivedFeedbackResponse | null>(`/sessoes/${sessionId}/meu-feedback`)
      .then((r) => r.data),

  getMyProblemFeedbacks: (
    roomId: string,
    problemId: string,
  ): Promise<ReceivedProblemFeedbacksResponse> =>
    api
      .get<ReceivedProblemFeedbacksResponse>(
        `/salas/${roomId}/problemas/${problemId}/meus-feedbacks`,
      )
      .then((r) => r.data),
};
