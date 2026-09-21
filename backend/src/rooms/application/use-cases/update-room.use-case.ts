import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RoomRepository } from '../../domain/repositories/room.repository';
import { UpdateRoomDto } from '../dtos/update-room.dto';
import { UpdateRoomResponseDto } from '../dtos/update-room-response.dto';
import { UserRepository } from '@/users/domain/repositories/user.repository.interface';

@Injectable()
export class UpdateRoomUseCase {
  constructor(
    @Inject('RoomRepository')
    private readonly roomRepository: RoomRepository,

    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(roomId: string, data: UpdateRoomDto): Promise<UpdateRoomResponseDto> {
    const { tutorId } = data;

    const tutor = await this.userRepository.findById(tutorId);

    if (!tutor) {
      throw new NotFoundException('Tutor não encontrado.');
    }

    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException('Sala não encontrada.');
    }

    if (room.tutorId !== tutorId) {
      throw new ForbiddenException('Você não tem permissão para editar esta sala.');
    }

    room.name = data.nome ?? room.name;
    room.semester = data.semestre ?? room.semester;
    room.active = data.ativo ?? room.active;

    await this.roomRepository.update(room);

    return {
      message: 'Sala atualizada com sucesso',
      data: room,
    };
  }
}
