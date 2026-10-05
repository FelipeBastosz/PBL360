import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';
import type { Room } from '../../domain/entities/room.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';

export interface RoomMember {
  id: string;
  type: UserType;
}

@Injectable()
export class RoomAccessService {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
  ) {}

  async assertTutorCanAccessRoom(roomId: string, tutorId: string): Promise<Room> {
    const room = await this.findActiveRoom(roomId);

    if (room.tutorId === tutorId) {
      return room;
    }

    const isAssociatedTutor = await this.roomRepository.hasTutor(roomId, tutorId);

    if (!isAssociatedTutor) {
      throw new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.');
    }

    return room;
  }

  async assertMemberCanAccessRoom(roomId: string, member: RoomMember): Promise<Room> {
    if (member.type === UserType.TUTOR) {
      return this.assertTutorCanAccessRoom(roomId, member.id);
    }

    const room = await this.findActiveRoom(roomId);

    if (!(await this.roomRepository.hasStudent(roomId, member.id))) {
      throw new ForbiddenError('Você não participa desta sala.');
    }

    return room;
  }

  async assertTutorIsRoomOwner(roomId: string, tutorId: string): Promise<Room> {
    const room = await this.findActiveRoom(roomId);

    if (room.tutorId !== tutorId) {
      throw new ForbiddenError('Apenas o professor responsável pode realizar esta ação.');
    }

    return room;
  }

  private async findActiveRoom(roomId: string): Promise<Room> {
    const room = await this.roomRepository.findById(roomId);

    if (!room || room.isDeleted()) {
      throw new NotFoundError('Sala não encontrada.');
    }

    return room;
  }
}
