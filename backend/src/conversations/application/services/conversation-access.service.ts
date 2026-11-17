import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { ROOM_REPOSITORY, type RoomRepository } from '@/rooms/domain/repositories/room.repository';
import type { UserType } from '@/users/domain/enums/user-type.enum';
import type { Room } from '@/rooms/domain/entities/room.entity';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from '../../domain/repositories/conversation.repository';
import type { Conversation } from '../../domain/entities/conversation.entity';

export interface AuthenticatedConversationUser {
  id: string;
  type: UserType;
}

export interface ConversationAccessResult {
  conversation: Conversation;
  room: Room;
}

@Injectable()
export class ConversationAccessService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversations: ConversationRepository,
    @Inject(ROOM_REPOSITORY)
    private readonly rooms: RoomRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async assertCanAccess(
    conversationId: string,
    user: AuthenticatedConversationUser,
  ): Promise<ConversationAccessResult> {
    const conversation = await this.conversations.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversa não encontrada.');
    }

    if (conversation.tutorId !== user.id && conversation.studentId !== user.id) {
      throw new ForbiddenError('Você não tem permissão para acessar esta conversa.');
    }

    const room = await this.roomAccess.assertMemberCanAccessRoom(conversation.roomId, user);

    return { conversation, room };
  }

  async assertCanSend(
    conversationId: string,
    user: AuthenticatedConversationUser,
  ): Promise<ConversationAccessResult> {
    const { conversation, room } = await this.assertCanAccess(conversationId, user);

    if (!room.active) {
      throw new ForbiddenError('Não é possível enviar mensagens em uma sala desativada.');
    }

    await this.assertRecipientIsRoomMember(room, conversation, user);

    return { conversation, room };
  }

  private async assertRecipientIsRoomMember(
    room: Room,
    conversation: Conversation,
    sender: AuthenticatedConversationUser,
  ): Promise<void> {
    const isSenderTutor = conversation.tutorId === sender.id;
    const recipientId = isSenderTutor ? conversation.studentId : conversation.tutorId;

    if (isSenderTutor) {
      const isStudentInRoom = await this.rooms.hasStudent(room.id, recipientId);
      if (!isStudentInRoom) {
        throw new ForbiddenError('O destinatário não possui mais vínculo com esta sala.');
      }
      return;
    }

    const isTutorInRoom =
      room.tutorId === recipientId || (await this.rooms.hasTutor(room.id, recipientId));
    if (!isTutorInRoom) {
      throw new ForbiddenError('O destinatário não possui mais vínculo com esta sala.');
    }
  }
}
