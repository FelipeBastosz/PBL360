export type Problem = {
  id: string;
  salaId: string;
  titulo: string;
  descricao: string | null;
  ordem: number;
  dataInicio: string | null;
  dataFim: string | null;
  tabelaId: string | null;
  autoavaliacaoLiberada: boolean;
  avaliacaoEntreParesLiberada: boolean;
  liberadoEm: string | null;
  prazoAutoavaliacao: string | null;
  criadoPor: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type CreateProblemPayload = {
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  tabelaId?: string;
};

export type UpdateProblemPayload = {
  title: string;
};

// Mirrors PUT /salas/:roomId/problemas/:problemId/tabela-desempenho.
export type ProblemPerformanceTable = {
  problemaId: string;
  tabela: { id: string; nome: string };
};

export type ProblemDeletionImpact = {
  sessoes: number;
  notas: number;
  feedbacks: number;
  avaliacoes: number;
};
