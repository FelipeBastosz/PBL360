import type { Room } from '../entities/room.entity';

export interface RoomRepository {
  save(room: Room): Promise<Room>;
  findById(id: string): Promise<Room | null>;
  findByCode(code: string): Promise<Room | null>;
  findByAccessToken(accessToken: string): Promise<Room | null>;
  update(room: Room): Promise<Room>;
  findById(id: string): Promise<Room | null>;
}

export const ROOM_REPOSITORY = Symbol('RoomRepository');
