import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';

import type { UpdateRoomDto } from '../dtos/update-room.dto';

import type { UpdateRoomResponseDto } from '../dtos/update-room-response.dto';

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
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException('Sala não encontrada.');
    }

    const isRoomTutor = await this.roomRepository.hasTutor(roomId, tutorId);

    if (!isRoomTutor) {
      throw new ForbiddenException('Você não tem permissão para editar esta sala.');
    }

    room.name = data.nome ?? room.name;

    room.semester = data.semestre ?? room.semester;

    room.active = data.ativo ?? room.active;

    const updatedRoom = await this.roomRepository.update(room);

    return {
      message: 'Sala atualizada com sucesso',
      data: updatedRoom,
    };
  }
}
