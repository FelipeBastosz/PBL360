import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ROOM_REPOSITORY, RoomRepository } from '../../domain/repositories/room.repository';
import { UpdateRoomDto } from '../dtos/update-room.dto';
import { UpdateRoomResponseDto } from '../dtos/update-room-response.dto';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@/users/domain/repositories/user.repository.interface';

@Injectable()
export class UpdateRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(roomId: string, data: UpdateRoomDto): Promise<UpdateRoomResponseDto> {
    const { tutorId } = data;

    if (!(await this.userRepository.findById(tutorId))) {
      throw new NotFoundException('Tutor não encontrado.');
    }

    const room = await this.roomRepository.findById(roomId);
    if (!room || room.isDeleted()) {
      throw new NotFoundException('Sala não encontrada.');
    }

    if (room.tutorId !== tutorId) {
      throw new ForbiddenException('Você não tem permissão para editar esta sala.');
    }

    Object.assign(room, {
      name: data.nome ?? room.name,
      semester: data.semestre ?? room.semester,
      active: data.ativo ?? room.active,
    });
    await this.roomRepository.save(room);

    return {
      message: 'Sala atualizada com sucesso',
      data: room,
    };
  }
}
