import { Inject, Injectable } from '@nestjs/common';
import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';
import { RoomAccessService } from '../services/room-access.service';

export interface DeleteRoomInput {
  roomId: string;
  tutorId: string;
}

@Injectable()
export class DeleteRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute({ roomId, tutorId }: DeleteRoomInput): Promise<void> {
    const room = await this.roomAccessService.assertTutorIsRoomOwner(roomId, tutorId);

    room.delete();

    await this.roomRepository.softDelete(room);
  }
}
