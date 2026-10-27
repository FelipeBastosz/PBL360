import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';

export interface LeaveRoomInput {
  roomId: string;
  userId: string;
}

export const OWNER_CANNOT_LEAVE_MESSAGE =
  'O professor responsável não pode sair da turma. Transfira a responsabilidade ou exclua a sala.';

@Injectable()
export class LeaveRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
  ) {}

  async execute({ roomId, userId }: LeaveRoomInput): Promise<void> {
    const room = await this.roomRepository.findById(roomId);

    if (!room || room.isDeleted()) {
      throw new NotFoundError('Sala não encontrada.');
    }

    if (room.tutorId === userId) {
      throw new ConflictError(OWNER_CANNOT_LEAVE_MESSAGE);
    }

    const isStudent = await this.roomRepository.hasStudent(roomId, userId);
    if (isStudent) {
      await this.roomRepository.removeStudent(roomId, userId);
      return;
    }

    const isTutor = await this.roomRepository.hasTutor(roomId, userId);
    if (isTutor) {
      await this.roomRepository.removeTutor(roomId, userId);
      return;
    }

    throw new ForbiddenError('Você não participa desta sala.');
  }
}
