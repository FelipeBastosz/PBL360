export type Problem = {
  id: string;
  salaId: string;
  titulo: string;
  descricao: string | null;
  ordem: number;
  dataInicio: string | null;
  dataFim: string | null;
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
};
