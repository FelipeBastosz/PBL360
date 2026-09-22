import type { Room } from '@/rooms/domain/entities/room.entity';

export class UpdateRoomResponseDto {
  message: string;
  data: Room;
}
