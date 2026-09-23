// Base entity representation mapping to the backend domain
export interface Room {
  id: string;
  tutorId: string;
  nome: string;
  semestre: string;
  ativo: boolean;
  codigo?: string;
  link?: string;
  createdAt?: string;
  updatedAt?: string;
}

// DTO for US01: Create tutorial room
export interface CreateRoomDTO {
  tutorId: string;
  nome: string;
  semestre: string;
}

// DTO for US03: Update tutorial room
export interface UpdateRoomDTO {
  tutorId: string;
  nome?: string;
  semestre?: string;
  ativo?: boolean;
}

// Response DTO for room updates
export interface UpdateRoomResponse {
  message: string;
  data: Room;
}
