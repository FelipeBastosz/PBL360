import { Inject, Injectable } from '@nestjs/common';
import {
  ROOM_REPOSITORY,
  type RoomRepository,
  type StudentRoomSummary,
} from '../../domain/repositories/room.repository';

@Injectable()
export class ListStudentRoomsUseCase {
  constructor(@Inject(ROOM_REPOSITORY) private readonly rooms: RoomRepository) {}

  async execute(studentId: string): Promise<StudentRoomSummary[]> {
    return this.rooms.findForStudent(studentId);
  }
}
