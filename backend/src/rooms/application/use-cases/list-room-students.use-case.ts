import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '../services/room-access.service';
import {
  ROOM_REPOSITORY,
  type RoomRepository,
  type RoomStudentSummary,
} from '../../domain/repositories/room.repository';

@Injectable()
export class ListRoomStudentsUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY) private readonly rooms: RoomRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async execute(roomId: string, tutorId: string): Promise<RoomStudentSummary[]> {
    await this.roomAccess.assertTutorCanAccessRoom(roomId, tutorId);
    return this.rooms.findStudents(roomId);
  }
}
