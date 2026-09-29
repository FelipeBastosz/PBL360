import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '@/shared/errors/application.error';
import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';

export interface JoinRoomInput {
  roomCode: string;
  studentId: string;
}

@Injectable()
export class JoinRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly rooms: RoomRepository,
  ) {}

  async execute(input: JoinRoomInput): Promise<void> {
    const room = await this.rooms.findByRoomCode(input.roomCode.trim());

    if (!room || room.isDeleted() || !room.active) {
      throw new NotFoundError('Código de ingresso inválido ou sala indisponível.');
    }

    await this.rooms.joinStudent(room.id, input.studentId);
  }
}
