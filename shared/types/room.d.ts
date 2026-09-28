export type Room = {
  id: string;
  professorResponsavelId: string;
  nome: string;
  codigoDisciplina: string;
  codigoSala: string;
  semestre: string;
  ativo: boolean;
  criadoEm: string;
};

export type CreateRoomPayload = {
  nome: string;
  codigoDisciplina: string;
  semestre: string;
};

export type UpdateRoomPayload = {
  nome?: string;
  semestre?: string;
  ativo?: boolean;
};

export type AddTutorToRoomPayload = {
  professorId: string;
};
