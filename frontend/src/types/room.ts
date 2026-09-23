export type Room = {
  id: string;
  nome: string;
  disciplina: string;
  semestre: string;
  codigo: string;
  link: string;
  createdAt: string;
};

export type CreateRoomPayload = {
  nome: string;
  disciplina: string;
  semestre: string;
};
