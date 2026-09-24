import type { Room } from '../entities/room.entity';

export interface RoomRepository {
  save(room: Room): Promise<Room>;

  findById(id: string): Promise<Room | null>;

  findByCourseCode(courseCode: string): Promise<Room | null>;

  findByRoomCode(roomCode: string): Promise<Room | null>;

  findByTutorId(tutorId: string): Promise<Room[]>;

  update(room: Room): Promise<Room>;

  addTutor(roomId: string, tutorId: string): Promise<void>;

  hasTutor(roomId: string, tutorId: string): Promise<boolean>;

  removeTutor(roomId: string, tutorId: string): Promise<void>;
}

export const ROOM_REPOSITORY = Symbol('RoomRepository');
