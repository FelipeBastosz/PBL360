export type ProfessorResponsavel = {
  id: string;
  nome: string;
  email: string;
};

export type Room = {
  id: string;
  professorResponsavelId: string;
  professorResponsavel?: ProfessorResponsavel;
  nome: string;
  codigoDisciplina: string;
  codigoSala: string;
  semestre: string;
  ativo: boolean;
  criadoEm: string;
  totalAlunos?: number;
  totalProblemas?: number;
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

export type RoomTutor = {
  id: string;
  nome: string;
  email: string;
  responsavel: boolean;
};

export type TutorSummary = {
  id: string;
  nome: string;
  email: string;
};

export type AddTutorToRoomPayload = {
  professorId: string;
};

export type StudentRoom = {
  salaId: string;
  nome: string;
  semestre: string;
  totalAlunos: number;
  totalProblemas?: number;
  professorResponsavel?: ProfessorResponsavel;
};

export type JoinRoomByCodePayload = {
  codigoSala: string;
};

export type JoinRoomByLinkPayload = {
  link: string;
};

export type RoomStudent = {
  id: string;
  nome: string;
  email: string;
  matricula: string | null;
  dataEntrada: string;
};
