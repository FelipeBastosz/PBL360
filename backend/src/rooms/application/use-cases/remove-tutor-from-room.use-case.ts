import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';

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
      throw new NotFoundError('Sala não encontrada.');
    }

    if (room.tutorId !== authenticatedTutorId) {
      throw new ForbiddenError('Apenas o professor responsável pode remover professores.');
    }

    if (room.tutorId === tutorId) {
      throw new ForbiddenError('O professor responsável não pode ser removido da sala.');
    }

    const isAssociated = await this.roomRepository.hasTutor(roomId, tutorId);

    if (!isAssociated) {
      throw new NotFoundError('Professor não está associado à sala.');
    }

    await this.roomRepository.removeTutor(roomId, tutorId);
  }
}
