import { Inject, Injectable } from '@nestjs/common';
import type { Room, RoomChanges } from '../../domain/entities/room.entity';
import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';
import { RoomAccessService } from '../services/room-access.service';

export interface UpdateRoomInput {
  roomId: string;
  tutorId: string;
  changes: RoomChanges;
}

@Injectable()
export class UpdateRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute({ roomId, tutorId, changes }: UpdateRoomInput): Promise<Room> {
    const room = await this.roomAccessService.assertTutorCanAccessRoom(roomId, tutorId);

    room.applyChanges(changes);

    return this.roomRepository.update(room);
  }
}
