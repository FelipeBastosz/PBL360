import { Inject, Injectable } from '@nestjs/common';
import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';

export interface ListedRoom {
  id: string;
  name: string;
  courseCode: string;
  semester: string;
  active: boolean;
  createdAt: Date;
}

@Injectable()
export class ListRoomsUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
  ) {}

  async execute(tutorId: string): Promise<ListedRoom[]> {
    const rooms = await this.roomRepository.findByTutorId(tutorId);

    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      courseCode: room.courseCode,
      semester: room.semester,
      active: room.active,
      createdAt: room.createdAt,
    }));
  }
}
