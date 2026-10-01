import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';
import { RoomAccessService } from '../services/room-access.service';

@Injectable()
export class RemoveTutorFromRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(roomId: string, authenticatedTutorId: string, tutorId: string): Promise<void> {
    const room = await this.roomAccessService.assertTutorIsRoomOwner(roomId, authenticatedTutorId);

    if (room.tutorId === tutorId) {
      throw new ForbiddenError('O professor responsável não pode ser removido da sala.');
    }

    if (!(await this.roomRepository.removeTutor(roomId, tutorId, authenticatedTutorId))) {
      throw new NotFoundError('Professor não está associado à sala.');
    }
  }
}
