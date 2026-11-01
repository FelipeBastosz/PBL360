export interface StudentProblemFeedbackResponse {
  id: string;
  escopo: 'ALUNO';
  destinatarioId: string;
  nota: number | null;
  texto: string;
  criadoEm: string;
  editadoEm: string | null;
  updatedAt?: string | null;
}

export interface GeneralFeedbackResponse {
  id: string;
  escopo: 'PROBLEMA';
  texto: string;
  criadoEm: string;
  editadoEm: string | null;
  updatedAt?: string | null;
}

export interface StudentWithFeedback {
  alunoId: string;
  nome: string;
  feedback: StudentProblemFeedbackResponse | null;
}

export interface ProblemFeedbacksResponse {
  geral: GeneralFeedbackResponse | null;
  alunos: StudentWithFeedback[];
}

export interface SaveStudentFeedbackPayload {
  escopo: 'ALUNO';
  destinatario_id: string;
  nota: number;
  texto: string;
}

export interface SaveGeneralFeedbackPayload {
  escopo: 'PROBLEMA';
  destinatario_id: null;
  nota: null;
  texto: string;
}

export interface FeedbackAuthor {
  id: string;
  nome: string;
}

export interface ReceivedFeedbackResponse {
  id: string;
  autor: FeedbackAuthor;
  texto: string;
  criadoEm: string;
  editadoEm: string | null;
  novo: boolean;
  nota: number | null;
}

export type ReceivedIndividualFeedbackResponse = ReceivedFeedbackResponse;

export interface ReceivedSessionFeedback {
  sessaoId: string;
  rotulo: string;
  data: string;
  feedback: ReceivedFeedbackResponse | null;
}

export interface ReceivedProblemFeedbacksResponse {
  notaFinal: number | null;
  individual: ReceivedIndividualFeedbackResponse | null;
  geral: ReceivedFeedbackResponse | null;
  sessoes: ReceivedSessionFeedback[];
}
