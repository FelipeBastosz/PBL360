import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';

@Injectable()
export class RemoveTutorFromRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
  ) {}

  async execute(roomId: string, authenticatedTutorId: string, tutorId: string): Promise<void> {
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException('Sala não encontrada.');
    }

    if (room.tutorId !== authenticatedTutorId) {
      throw new ForbiddenException('Apenas o professor responsável pode remover professores.');
    }

    if (room.tutorId === tutorId) {
      throw new ForbiddenException('O professor responsável não pode ser removido da sala.');
    }

    const isAssociated = await this.roomRepository.hasTutor(roomId, tutorId);

    if (!isAssociated) {
      throw new NotFoundException('Professor não está associado à sala.');
    }

    await this.roomRepository.removeTutor(roomId, tutorId);
  }
}
