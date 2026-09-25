import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';

import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';

import type { UpdateRoomDto } from '../dtos/update-room.dto';

import type { UpdateRoomResponseDto } from '../dtos/update-room-response.dto';

import { Room } from '../../domain/entities/room.entity';

@Injectable()
export class UpdateRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
  ) {}

  async execute(
    roomId: string,
    tutorId: string,
    data: UpdateRoomDto,
  ): Promise<UpdateRoomResponseDto> {
    const room = await this.getRoomForEditing(roomId, tutorId);

    Object.assign(room, {
      name: data.nome ?? room.name,
      semester: data.semestre ?? room.semester,
      active: data.ativo ?? room.active,
    });

    const updatedRoom = await this.roomRepository.update(room);

    return {
      message: 'Sala atualizada com sucesso',
      data: updatedRoom,
    };
  }

  private async getRoomForEditing(roomId: string, tutorId: string): Promise<Room> {
    const room = await this.roomRepository.findById(roomId);

    if (!room || room.isDeleted()) {
      throw new NotFoundError('Sala não encontrada.');
    }

    const isRoomTutor = await this.roomRepository.hasTutor(roomId, tutorId);

    if (!isRoomTutor) {
      throw new ForbiddenError('Você não tem permissão para editar esta sala.');
    }

    return room;
  }
}
