import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';

export interface RoomDetail {
  id: string;
  tutorId: string;
  name: string;
  courseCode: string;
  roomCode: string;
  semester: string;
  active: boolean;
  createdAt: Date;
}

@Injectable()
export class GetRoomDetailUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
  ) {}

  async execute(roomId: string, tutorId: string): Promise<RoomDetail> {
    const room = await this.roomRepository.findById(roomId);

    if (!room || room.isDeleted()) {
      throw new NotFoundException('Sala não encontrada.');
    }

    const isTutor = await this.roomRepository.hasTutor(roomId, tutorId);

    if (!isTutor) {
      throw new ForbiddenException('Você não tem permissão para acessar esta sala.');
    }

    return {
      id: room.id,
      tutorId: room.tutorId,
      name: room.name,
      courseCode: room.courseCode,
      roomCode: room.roomCode,
      semester: room.semester,
      active: room.active,
      createdAt: room.createdAt,
    };
  }
}
