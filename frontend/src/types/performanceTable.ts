export type PerformanceTableOrigin = 'TURMA' | 'PESSOAL' | 'PADRAO';

export type PerformanceTableAuthor = {
  id: string | null;
  nome: string;
};

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
  quantidadeProblemas?: number;
  origem?: PerformanceTableOrigin;
  autor?: PerformanceTableAuthor;
  emUso?: number;
  criadoEm?: string;
  atualizadoEm?: string;
};

export type RoomPerformanceTableItem = {
  id: string;
  nome: string;
  descricao?: string | null;
  origem: PerformanceTableOrigin;
  autor: PerformanceTableAuthor;
  criterios: Array<{
    id: string;
    nome: string;
    peso: number;
    ordem?: number;
  }>;
  emUso: number;
};

export type PerformanceTable = {
  id: string;
  professorId?: string;
  nome: string;
  descricao: string | null;
  quantidadeProblemas?: number;
  criterios: Criterion[];
  origem?: PerformanceTableOrigin;
  autor?: PerformanceTableAuthor;
  criadoEm?: string;
  atualizadoEm?: string;
};

export type CreatePerformanceTablePayload = {
  nome: string;
  descricao?: string;
  criterios: CriterionInput[];
  roomId?: string;
};

export type UpdatePerformanceTablePayload = {
  nome: string;
  descricao?: string | null;
  criterios: CriterionInput[];
};
