import { Inject, Injectable } from '@nestjs/common';
import {
  ForbiddenError,
  InvalidRequestError,
  NotFoundError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import { USER_REPOSITORY, type UserRepository } from '@/users/domain/repositories/user.repository';
import {
  ROOM_REPOSITORY,
  type RoomRepository,
  type TransferRoomOwnershipOutcome,
} from '../../domain/repositories/room.repository';
import { RoomAccessService } from '../services/room-access.service';

export interface TransferRoomOwnershipCommand {
  roomId: string;
  authenticatedTutorId: string;
  newOwnerId: string;
}

export interface TransferredRoomOwnership {
  id: string;
  tutorId: string;
}

const mapOutcomeToError = (
  outcome: Exclude<TransferRoomOwnershipOutcome, { status: 'transferred' }>,
) => {
  switch (outcome.status) {
    case 'not_found':
      return new NotFoundError('Sala não encontrada.');
    case 'not_owner':
      return new ForbiddenError('Apenas o professor responsável pode realizar esta ação.');
    case 'same_owner':
      return new InvalidRequestError('O professor selecionado já é o responsável pela sala.');
    case 'tutor_not_linked':
      return new UnprocessableEntityError('O professor destinatário não está vinculado à sala.');
  }
};

@Injectable()
export class TransferRoomOwnershipUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(command: TransferRoomOwnershipCommand): Promise<TransferredRoomOwnership> {
    const room = await this.roomAccessService.assertTutorIsRoomOwner(
      command.roomId,
      command.authenticatedTutorId,
    );
    if (room.tutorId === command.newOwnerId) {
      throw new InvalidRequestError('O professor selecionado já é o responsável pela sala.');
    }
    await this.assertValidRecipient(command.roomId, command.newOwnerId);

    const outcome = await this.roomRepository.transferOwnership({
      roomId: command.roomId,
      expectedOwnerId: command.authenticatedTutorId,
      newOwnerId: command.newOwnerId,
      transferredById: command.authenticatedTutorId,
    });
    if (outcome.status !== 'transferred') {
      throw mapOutcomeToError(outcome);
    }
    return { id: outcome.roomId, tutorId: outcome.ownerId };
  }

  private async assertValidRecipient(roomId: string, newOwnerId: string): Promise<void> {
    const tutor = await this.userRepository.findById(newOwnerId);
    if (!tutor || !tutor.isTutor()) {
      throw new NotFoundError('Professor não encontrado.');
    }
    if (!tutor.active) {
      throw new UnprocessableEntityError('O professor destinatário está inativo.');
    }
    if (!(await this.roomRepository.hasTutor(roomId, newOwnerId))) {
      throw new UnprocessableEntityError('O professor destinatário não está vinculado à sala.');
    }
  }
}
