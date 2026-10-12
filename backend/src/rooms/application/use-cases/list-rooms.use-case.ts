import { Inject, Injectable } from '@nestjs/common';
import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';
import type { Room } from '../../domain/entities/room.entity';

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
