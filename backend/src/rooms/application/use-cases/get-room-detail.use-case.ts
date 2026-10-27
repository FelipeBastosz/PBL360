import { Injectable } from '@nestjs/common';
import type { Room } from '../../domain/entities/room.entity';
import { RoomAccessService } from '../services/room-access.service';

export interface GetRoomDetailInput {
  roomId: string;
  tutorId: string;
}

@Injectable()
export class GetRoomDetailUseCase {
  constructor(private readonly roomAccessService: RoomAccessService) {}

  execute({ roomId, tutorId }: GetRoomDetailInput): Promise<Room> {
    return this.roomAccessService.assertTutorCanAccessRoom(roomId, tutorId);
  }
}
