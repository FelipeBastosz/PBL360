export enum EvaluationAdjustmentSituation {
  SEM_AJUSTE = 'SEM_AJUSTE',
  AJUSTADA = 'AJUSTADA',
}

export interface SessionEvaluationHistoryItem {
  alunoId: string;
  nome: string;
  matricula: string | null;
  notaAluno: number | null;
  notaAlunoOriginal: number | null;
  notaTutor: number | null;
  notaPares: number | null;
  avaliacoesPares: number;
  situacaoAjuste: EvaluationAdjustmentSituation;
}

export interface ComparisonCriterionItem {
  criterioId: string;
  nome: string;
  notaAluno: number | null;
  notaTutor: number | null;
}

export interface ComparisonSelfAssessment {
  status: string;
  enviadaEm: Date | null;
  notaConsolidada: number | null;
  itens: ComparisonCriterionItem[];
}

export interface ComparisonPeerEvaluationItemScore {
  criterioId: string;
  nota: number;
}

export interface ComparisonPeerEvaluation {
  avaliadorId: string;
  avaliadorNome: string;
  enviadaEm: Date;
  notaConsolidada: number;
  itens: ComparisonPeerEvaluationItemScore[];
}

export interface ComparisonAdjustmentAuthor {
  id: string;
  nome: string;
}

export interface ComparisonAdjustment {
  valorAnterior: number;
  valorNovo: number;
  justificativa: string;
  autor: ComparisonAdjustmentAuthor;
  ajustadoEm: Date;
}

export interface StudentSessionEvaluationComparison {
  aluno: {
    alunoId: string;
    nome: string;
  };
  autoavaliacao: ComparisonSelfAssessment;
  pares: ComparisonPeerEvaluation[];
  ajustes: ComparisonAdjustment[];
}
