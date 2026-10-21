export type EvaluationStatus = 'PENDENTE' | 'RASCUNHO' | 'ENVIADA';

export type SessionEvaluationSummary = {
  alunoId: string;
  nome: string;
  iniciais: string;
  presenca: 'ausente' | 'justificado' | 'presente' | null;
  status: EvaluationStatus;
  notaSessao: number | null;
};

export type ProblemEvaluationCriteria = {
  tabela: {
    id: string;
    nome: string;
  };
  criterios: Array<{
    id: string;
    nome: string;
    peso: number;
    notaMaxima: number;
    ordem: number;
  }>;
};

export type CriterionScore = {
  criterioId: string;
  nota: number;
};

export type EvaluationCriterion = {
  id: string;
  nome: string;
  peso: number;
  ordem: number;
  notaMaxima?: number;
  descricao?: string | null;
};

export type TutorEvaluationData = {
  status: EvaluationStatus;
  enviadaEm: string | null;
  itens: CriterionScore[];
  criterios: EvaluationCriterion[];
  notaSessao: number | null;
};

export type SaveTutorEvaluationPayload = {
  itens: CriterionScore[];
  enviar: boolean;
  justificativa?: string;
};

export type SessionFeedbackResponse = {
  id: string;
  texto: string;
  criadoEm: string;
};

export type SelfAssessmentAdjustmentAuthor = {
  id: string;
  nome: string;
};

export type SelfAssessmentAdjustment = {
  valorAnterior: number;
  valorNovo: number;
  justificativa: string;
  autor: SelfAssessmentAdjustmentAuthor;
  ajustadoEm: string;
};

export type AdjustSelfAssessmentPayload = {
  novaNota: number;
  justificativa: string;
};

export type SelfAssessmentAdjustmentResponse = {
  alunoId: string;
  notaOriginal: number;
  notaVigente: number;
  ajuste: SelfAssessmentAdjustment;
};

export type SelfAssessmentAdjustmentHistoryResponse = {
  notaOriginal: number | null;
  notaVigente: number | null;
  ajustes: SelfAssessmentAdjustment[];
};

export type EvaluationAdjustmentSituation = 'SEM_AJUSTE' | 'AJUSTADA';

export type StudentEvaluationHistoryItem = {
  alunoId: string;
  nome: string;
  matricula: string | null;
  notaAluno: number | null;
  notaAlunoOriginal: number | null;
  notaTutor: number | null;
  notaPares: number | null;
  avaliacoesPares: number;
  situacaoAjuste: EvaluationAdjustmentSituation;
};

export type SessionEvaluationHistoryResponse = {
  alunos: StudentEvaluationHistoryItem[];
};

export type SelfAssessmentResponse = {
  status: EvaluationStatus;
  enviadaEm: string | null;
  itens: CriterionScore[];
  criterios: EvaluationCriterion[];
  notaSessao: number | null;
};

export type SaveSelfAssessmentPayload = {
  itens: CriterionScore[];
  enviar: boolean;
};

export type SessionPeerStudent = {
  alunoId: string;
  nome: string;
  iniciais: string;
  status: EvaluationStatus;
};

export type SessionPeersResponse = {
  liberada: boolean;
  prazo: string | null;
  colegas: SessionPeerStudent[];
};

export type PeerEvaluationResponse = {
  colegaId: string;
  status: EvaluationStatus;
  enviadaEm: string | null;
  itens: CriterionScore[];
  criterios: EvaluationCriterion[];
};

export type SavePeerEvaluationPayload = {
  itens: CriterionScore[];
  enviar: boolean;
};

export type StudentSelfAssessmentSummary = {
  liberada: boolean;
  prazo: string | null;
  status: string;
};

export type StudentPeerAssessmentSummary = {
  liberada: boolean;
  prazo: string | null;
  avaliados: number;
  total: number;
};

export type StudentFeedbackSummary = {
  disponivel: boolean;
  novo: boolean;
};

export type StudentEvaluationSummaryResponse = {
  autoavaliacao: StudentSelfAssessmentSummary;
  pares: StudentPeerAssessmentSummary;
  feedback: StudentFeedbackSummary;
};
