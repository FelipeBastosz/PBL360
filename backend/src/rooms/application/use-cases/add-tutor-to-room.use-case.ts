import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '@/shared/errors/application.error';
import { USER_REPOSITORY, type UserRepository } from '@/users/domain/repositories/user.repository';
import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';
import { RoomAccessService } from '../services/room-access.service';

export interface AddTutorToRoomInput {
  roomId: string;
  authenticatedTutorId: string;
  tutorId: string;
}

@Injectable()
export class AddTutorToRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute({ roomId, authenticatedTutorId, tutorId }: AddTutorToRoomInput): Promise<void> {
    await this.roomAccessService.assertTutorIsRoomOwner(roomId, authenticatedTutorId);

    const tutor = await this.userRepository.findById(tutorId);

    if (!tutor || !tutor.isTutor()) {
      throw new NotFoundError('Professor não encontrado.');
    }

    if (!(await this.roomRepository.addTutor(roomId, tutorId))) {
      throw new ConflictError('Este professor já está associado à sala.');
    }
  }
}
