export type Session = {
  id: string;
  titulo: string;
  descricao: string | null;
  data: string;
  ordem: number;
  status: string;
};

export type CreateSessionPayload = {
  titulo: string;
  descricao?: string | null;
  data: string;
};

export type UpdateSessionPayload = {
  titulo: string;
  descricao?: string | null;
  data: string;
};

export type SessionDeletionImpact = {
  podeExcluir: boolean;
  chamada: number;
  papeis: number;
  observacoes: number;
  avaliacoes: number;
  feedbacks: number;
};
