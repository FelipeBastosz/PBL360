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
