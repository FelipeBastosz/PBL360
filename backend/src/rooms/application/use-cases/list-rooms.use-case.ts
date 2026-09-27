import { Inject, Injectable } from '@nestjs/common';
import type { Room } from '../../domain/entities/room.entity';
import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';

@Injectable()
export class ListRoomsUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
  ) {}

  execute(tutorId: string): Promise<Room[]> {
    return this.roomRepository.findByTutorId(tutorId);
  }
}
