import { Injectable } from '@nestjs/common';
import type { Room } from '../../domain/entities/room.entity';
import { RoomAccessService } from '../services/room-access.service';

@Injectable()
export class GetRoomDetailUseCase {
  constructor(private readonly roomAccessService: RoomAccessService) {}

  execute(roomId: string, tutorId: string): Promise<Room> {
    return this.roomAccessService.assertTutorCanAccessRoom(roomId, tutorId);
  }
}
