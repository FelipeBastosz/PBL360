import type { Room } from '../entities/room.entity';

export interface StudentRoomSummary {
  roomId: string;
  name: string;
  semester: string;
  totalStudents: number;
  totalProblems: number;
}

export interface TutorRoomSummary {
  room: Room;
  totalStudents: number;
  totalProblems: number;
}

export interface RoomStudentSummary {
  id: string;
  name: string;
  email: string;
  registrationNumber: string | null;
  joinedAt: Date;
}

export interface RoomTutor {
  id: string;
  name: string;
  email: string;
  isResponsible: boolean;
}

export interface RoomRepository {
  create(room: Room): Promise<Room>;

  findById(id: string): Promise<Room | null>;

  findByRoomCode(roomCode: string): Promise<Room | null>;

  joinStudent(roomId: string, studentId: string): Promise<void>;

  findByTutorId(tutorId: string): Promise<TutorRoomSummary[]>;

  update(room: Room): Promise<Room>;

  softDelete(room: Room): Promise<void>;

  addTutor(roomId: string, tutorId: string): Promise<boolean>;

  hasTutor(roomId: string, tutorId: string): Promise<boolean>;

  hasStudent(roomId: string, studentId: string): Promise<boolean>;

  listTutors(roomId: string): Promise<RoomTutor[]>;

  removeTutor(roomId: string, tutorId: string): Promise<boolean>;

  findForStudent(studentId: string): Promise<StudentRoomSummary[]>;

  findStudents(roomId: string): Promise<RoomStudentSummary[]>;
}

export const ROOM_REPOSITORY = Symbol('RoomRepository');
