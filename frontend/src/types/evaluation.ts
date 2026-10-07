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
