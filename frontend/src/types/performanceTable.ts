export type Criterion = {
  id: string;
  nome: string;
  descricao: string | null;
  peso: number;
  ordem: number;
};

export type CriterionInput = {
  id?: string;
  nome: string;
  descricao?: string | null;
  peso: number;
  ordem: number;
};

export type PerformanceTableSummary = {
  id: string;
  nome: string;
  descricao: string | null;
  quantidadeCriterios: number;
  quantidadeProblemas: number;
  criadoEm: string;
  atualizadoEm: string;
};

export type PerformanceTable = {
  id: string;
  professorId: string;
  nome: string;
  descricao: string | null;
  quantidadeProblemas: number;
  criterios: Criterion[];
  criadoEm: string;
  atualizadoEm: string;
};

export type CreatePerformanceTablePayload = {
  nome: string;
  descricao?: string;
  criterios: CriterionInput[];
};

export type UpdatePerformanceTablePayload = {
  nome: string;
  descricao?: string | null;
  criterios: CriterionInput[];
};

export const CRITERION_MAX_SCORE = 10;
