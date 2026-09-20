import type { Room } from '../entities/room.entity';

export interface RoomRepository {
  save(room: Room): Promise<Room>;
  findById(id: string): Promise<Room | null>;
  findByCode(code: string): Promise<Room | null>;
  findByAccessToken(accessToken: string): Promise<Room | null>;
<<<<<<< HEAD
  findById(roomId: string): Promise<Room | null>;
  update(room: Room): Promise<void>;
=======
  update(room: Room): Promise<Room>;
>>>>>>> 8c514a9a2c4246350c86c610b949378e0035d94b
}

export const ROOM_REPOSITORY = Symbol('RoomRepository');
