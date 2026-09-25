import { Injectable, Inject } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { ROOM_REPOSITORY, RoomRepository } from '../../domain/repositories/room.repository';
import { DeleteRoomDto } from '../dtos/delete-room.dto';

@Injectable()
export class DeleteRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
  ) {}

  async execute(roomId: string, dto: DeleteRoomDto): Promise<void> {
    const room = await this.roomRepository.findById(roomId);

    if (!room || room.isDeleted()) {
      throw new NotFoundError('Sala não encontrada ou já excluída.');
    }

    if (room.tutorId !== dto.tutorId) {
      throw new ForbiddenError('Acesso negado. Apenas o tutor responsável pode excluir esta sala.');
    }

    room.delete();

    await this.roomRepository.save(room);
  }
}
