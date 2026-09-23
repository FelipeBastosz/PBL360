import type { Room } from '../entities/room.entity';

export interface RoomRepository {
  save(room: Room): Promise<Room>;
  findById(id: string): Promise<Room | null>;
  findByCode(code: string): Promise<Room | null>;
  findByAccessToken(accessToken: string): Promise<Room | null>;
  update(room: Room): Promise<Room>;
  addTutor(roomId: string, tutorId: string): Promise<void>;
  hasTutor(roomId: string, tutorId: string): Promise<boolean>;
  removeTutor(roomID: string, tutorId: string): Promise<void>;
}

export const ROOM_REPOSITORY = Symbol('RoomRepository');
