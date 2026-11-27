export interface StudentProblemFeedbackResponse {
  id: string;
  escopo: 'ALUNO';
  destinatarioId: string;
  sessaoId?: string | null;
  sessionId?: string | null;
  nota: number | null;
  texto: string;
  criadoEm: string;
  editadoEm: string | null;
  updatedAt?: string | null;
  justificativa?: string | null;
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
  sessaoId?: string | null;
  sessionId?: string | null;
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
  sessao_id?: string;
  nota: number;
  texto: string;
  justificativa?: string;
}

export interface SaveGeneralFeedbackPayload {
  texto: string;
}

export interface FeedbackAuthor {
  id: string;
  nome: string;
}

export interface ReceivedComponentGrade {
  nota: number | null;
  situacao: string;
  origem?: 'FORMULARIO' | 'PLANNING_POKER';
}

export interface ReceivedSessionComponents {
  modalidade: 'AUTOAVALIACAO' | 'PARES';
  autoavaliacao: ReceivedComponentGrade | null;
  pares: ReceivedComponentGrade | null;
}

export interface ReceivedFeedbackResponse {
  id: string;
  autor: FeedbackAuthor;
  texto: string;
  criadoEm: string;
  editadoEm: string | null;
  novo: boolean;
  nota: number | null;
  avaliacoes?: ReceivedSessionComponents;
}

export type ReceivedIndividualFeedbackResponse = ReceivedFeedbackResponse;

export interface ReceivedSessionFeedback {
  sessaoId: string;
  rotulo: string;
  data: string;
  feedback: ReceivedFeedbackResponse | null;
  nota?: number | null;
  avaliacoes?: ReceivedSessionComponents;
}

export interface ReceivedProblemFeedbacksResponse {
  notaFinal: number | null;
  individual: ReceivedIndividualFeedbackResponse | null;
  geral: ReceivedFeedbackResponse | null;
  sessoes: ReceivedSessionFeedback[];
}

export interface FeedbackTemplateResponse {
  id: string;
  titulo: string;
  texto: string;
}
