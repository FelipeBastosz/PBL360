import type { Room } from '../entities/room.entity';

export interface RoomRepository {
  create(room: Room): Promise<Room>;

  findById(id: string): Promise<Room | null>;

  findByTutorId(tutorId: string): Promise<Room[]>;

  update(room: Room): Promise<Room>;

  softDelete(room: Room): Promise<void>;

  addTutor(roomId: string, tutorId: string): Promise<boolean>;

  hasTutor(roomId: string, tutorId: string): Promise<boolean>;

  removeTutor(roomId: string, tutorId: string): Promise<boolean>;
}

export const ROOM_REPOSITORY = Symbol('RoomRepository');
