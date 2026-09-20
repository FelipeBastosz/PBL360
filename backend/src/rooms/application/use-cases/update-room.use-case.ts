import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RoomRepository } from '../../domain/repositories/room.repository';
import { UpdateRoomDto } from '../dtos/update-room.dto';
import { Room } from '../../domain/entities/room.entity';

@Injectable()
export class UpdateRoomUseCase {
  constructor(
    @Inject('RoomRepository')
    private readonly roomRepository: RoomRepository,
  ) {}

  async execute(roomId: string, tutorId: string, data: UpdateRoomDto): Promise<Room> {
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException('Sala não encontrada.');
    }

    // Validation: Only the owner of the room can edit it.
    if (room.tutorId !== tutorId) {
      throw new ForbiddenException('Você não tem permissão para editar esta sala.');
    }

    // Update only the fields that were explicitly sent in the request.
    // We use !== undefined to ensure that the value `false` in active is not ignored.
    if (data.name !== undefined) room.name = data.name;
    if (data.semester !== undefined) room.semester = data.semester;
    if (data.active !== undefined) room.active = data.active;

    // Code and link are preserved.
    await this.roomRepository.update(room);

    return room;
  }
}
