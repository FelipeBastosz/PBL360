import { Inject, Injectable } from '@nestjs/common';
import {
  ROOM_REPOSITORY,
  type RoomRepository,
  type RoomTutor,
} from '@/rooms/domain/repositories/room.repository';
import { RoomAccessService } from '../services/room-access.service';

@Injectable()
export class ListRoomTutorsUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(roomId: string, tutorId: string): Promise<RoomTutor[]> {
    await this.roomAccessService.assertTutorCanAccessRoom(roomId, tutorId);
    return this.roomRepository.listTutors(roomId);
  }
}
