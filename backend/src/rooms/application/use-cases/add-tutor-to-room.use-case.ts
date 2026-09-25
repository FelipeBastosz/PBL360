import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/application.error';

import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';

import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/users/domain/repositories/user.repository.interface';

@Injectable()
export class AddTutorToRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(roomId: string, authenticatedTutorId: string, tutorId: string): Promise<void> {
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundError('Sala não encontrada.');
    }

    if (room.tutorId !== authenticatedTutorId) {
      throw new ForbiddenError('Apenas o professor responsável pode adicionar professores.');
    }

    const tutor = await this.userRepository.findById(tutorId);

    if (!tutor || !tutor.isTutor()) {
      throw new NotFoundError('Professor não encontrado.');
    }

    const alreadyAssociated = await this.roomRepository.hasTutor(roomId, tutorId);

    if (alreadyAssociated) {
      throw new ConflictError('Este professor já está associado à sala.');
    }

    await this.roomRepository.addTutor(roomId, tutorId);
  }
}
