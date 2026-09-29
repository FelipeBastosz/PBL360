export type CriterionCategory = 'CONTENT' | 'PARTICIPATION' | 'BEHAVIOR';

export type Criterion = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: CriterionCategory;
  peso: number;
  notaMaxima: number;
  ordem: number;
};

export type CriterionInput = {
  nome: string;
  descricao?: string;
  categoria: CriterionCategory;
  peso: number;
  notaMaxima: number;
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

export type UpdatePerformanceTablePayload = Partial<CreatePerformanceTablePayload>;

export const CRITERION_CATEGORIES: readonly CriterionCategory[] = [
  'CONTENT',
  'PARTICIPATION',
  'BEHAVIOR',
];

export const CRITERION_CATEGORY_LABELS: Record<CriterionCategory, string> = {
  CONTENT: 'Conteúdo',
  PARTICIPATION: 'Participação',
  BEHAVIOR: 'Comportamento',
};
