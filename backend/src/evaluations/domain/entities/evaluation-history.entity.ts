export enum EvaluationAdjustmentSituation {
  SEM_AJUSTE = 'SEM_AJUSTE',
  AJUSTADA = 'AJUSTADA',
}

export enum EvaluationHistoryOrigin {
  AUTOAVALIACAO = 'AUTOAVALIACAO',
  PARES = 'PARES',
  PLANNING_POKER = 'PLANNING_POKER',
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
  origem: EvaluationHistoryOrigin | null;
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

export interface ComparisonPokerVote {
  avaliadorId: string | null;
  avaliadorNome: string | null;
  nota: number;
}

export interface ComparisonPlanningPoker {
  rodadaId: string;
  numero: number;
  anonimo: boolean;
  media: number | null;
  notaDecidida: number;
  notaVigente: number;
  ajustadaNaMesa: boolean;
  justificativaMesa: string | null;
  decididaEm: Date;
  decididaPor: ComparisonAdjustmentAuthor | null;
  votos: ComparisonPokerVote[];
}

export interface StudentSessionEvaluationComparison {
  aluno: {
    alunoId: string;
    nome: string;
  };
  autoavaliacao: ComparisonSelfAssessment;
  pares: ComparisonPeerEvaluation[];
  planningPoker: ComparisonPlanningPoker | null;
  ajustes: ComparisonAdjustment[];
}
