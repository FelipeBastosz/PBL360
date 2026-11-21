import { Inject, Injectable } from '@nestjs/common';
import {
  ForbiddenError,
  InvalidRequestError,
  NotFoundError,
} from '@/shared/errors/application.error';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { ROOM_REPOSITORY, type RoomRepository } from '@/rooms/domain/repositories/room.repository';
import { USER_REPOSITORY, type UserRepository } from '@/users/domain/repositories/user.repository';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { User } from '@/users/domain/entities/user.entity';
import type { Room } from '@/rooms/domain/entities/room.entity';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from '../../domain/repositories/conversation.repository';
import type { Conversation } from '../../domain/entities/conversation.entity';

export interface GetOrCreateConversationInput {
  roomId: string;
  authenticatedUser: {
    id: string;
    type: UserType;
  };
  recipientId: string;
}

export interface GetOrCreateConversationOutput {
  conversation: Conversation;
  interlocutor: {
    id: string;
    name: string;
    type: UserType;
    hasPhoto: boolean;
  };
  created: boolean;
}

@Injectable()
export class GetOrCreateConversationUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversations: ConversationRepository,
    @Inject(ROOM_REPOSITORY)
    private readonly rooms: RoomRepository,
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async execute(input: GetOrCreateConversationInput): Promise<GetOrCreateConversationOutput> {
    const { roomId, authenticatedUser, recipientId } = input;
    if (authenticatedUser.id === recipientId) {
      throw new InvalidRequestError('Não é possível iniciar uma conversa consigo mesmo.');
    }
    const room = await this.roomAccess.assertMemberCanAccessRoom(roomId, authenticatedUser);
    if (!room.active) {
      throw new ForbiddenError('Não é possível iniciar conversas em uma sala desativada.');
    }
    const recipient = await this.getRecipient(recipientId);

    this.validateRoles(authenticatedUser.type, recipient.type);
    const participants = await this.resolveParticipants(room, authenticatedUser, recipient);

    const { conversation, created } = await this.conversations.findOrCreate(
      roomId,
      participants.tutorId,
      participants.studentId,
    );

    return this.toOutput(conversation, recipient, created);
  }

  private async getRecipient(recipientId: string): Promise<User> {
    const recipient = await this.users.findById(recipientId);
    if (!recipient || !recipient.active) {
      throw new NotFoundError('Destinatário não encontrado.');
    }
    return recipient;
  }

  private validateRoles(authType: UserType, recipientType: UserType): void {
    if (authType === recipientType) {
      throw new InvalidRequestError('Conversas só são permitidas entre um professor e um aluno.');
    }
  }

  private async resolveParticipants(
    room: Room,
    authenticatedUser: { id: string; type: UserType },
    recipient: User,
  ): Promise<{ tutorId: string; studentId: string }> {
    if (authenticatedUser.type === UserType.TUTOR) {
      const isStudentInRoom = await this.rooms.hasStudent(room.id, recipient.id);
      if (!isStudentInRoom) {
        throw new ForbiddenError('O discente informado não possui vínculo com esta sala.');
      }
      return { tutorId: authenticatedUser.id, studentId: recipient.id };
    }

    const isTutorInRoom =
      room.tutorId === recipient.id || (await this.rooms.hasTutor(room.id, recipient.id));
    if (!isTutorInRoom) {
      throw new ForbiddenError('O professor informado não possui vínculo com esta sala.');
    }
    return { tutorId: recipient.id, studentId: authenticatedUser.id };
  }

  private toOutput(
    conversation: Conversation,
    recipient: User,
    created: boolean,
  ): GetOrCreateConversationOutput {
    return {
      conversation,
      interlocutor: {
        id: recipient.id,
        name: recipient.name,
        type: recipient.type,
        hasPhoto: recipient.hasPhoto,
      },
      created,
    };
  }
}
