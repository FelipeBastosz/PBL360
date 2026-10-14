import { api } from './api';
import type {
  ProblemFeedbacksResponse,
  StudentProblemFeedbackResponse,
  GeneralFeedbackResponse,
  SaveStudentFeedbackPayload,
  SaveGeneralFeedbackPayload,
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
};
