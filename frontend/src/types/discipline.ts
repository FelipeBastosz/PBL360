export type Discipline = {
  id: string;
  codigo: string;
  nome: string;
};

export type CreateDisciplinePayload = {
  codigo: string;
  nome: string;
};
