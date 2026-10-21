import { Inject, Injectable } from '@nestjs/common';
import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';
import type { TutorRoomSummary } from '../../domain/repositories/room.repository';

@Injectable()
export class ListRoomsUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
  ) {}

  execute(tutorId: string): Promise<TutorRoomSummary[]> {
    return this.roomRepository.findByTutorId(tutorId);
  }
}
