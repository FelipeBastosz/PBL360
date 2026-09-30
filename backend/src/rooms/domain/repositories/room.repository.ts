import type { Room } from '../entities/room.entity';

export interface StudentRoomSummary {
  roomId: string;
  name: string;
  semester: string;
  totalStudents: number;
}

export interface RoomStudentSummary {
  name: string;
  joinedAt: Date;
}

export interface RoomRepository {
  create(room: Room): Promise<Room>;

  findById(id: string): Promise<Room | null>;

  findByRoomCode(roomCode: string): Promise<Room | null>;

  joinStudent(roomId: string, studentId: string): Promise<void>;

  findByTutorId(tutorId: string): Promise<Room[]>;

  update(room: Room): Promise<Room>;

  softDelete(room: Room): Promise<void>;

  addTutor(roomId: string, tutorId: string, actorId: string): Promise<boolean>;

  hasTutor(roomId: string, tutorId: string): Promise<boolean>;

  removeTutor(roomId: string, tutorId: string, actorId: string): Promise<boolean>;

  findForStudent(studentId: string): Promise<StudentRoomSummary[]>;

  findStudents(roomId: string): Promise<RoomStudentSummary[]>;
}

export const ROOM_REPOSITORY = Symbol('RoomRepository');
