import { Inject, Injectable } from '@nestjs/common';
import {
  ForbiddenError,
  InvalidRequestError,
  NotFoundError,
} from '@/shared/errors/application.error';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { ROOM_REPOSITORY, type RoomRepository } from '@/rooms/domain/repositories/room.repository';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { Room } from '@/rooms/domain/entities/room.entity';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from '../../domain/repositories/conversation.repository';
import {
  MESSAGE_REPOSITORY,
  type MessageRepository,
} from '../../domain/repositories/message.repository';
import type { Message } from '../../domain/entities/message.entity';
import type { Conversation } from '../../domain/entities/conversation.entity';

export interface SendMessageInput {
  conversationId: string;
  authenticatedUser: {
    id: string;
    type: UserType;
  };
  texto: string;
}

@Injectable()
export class SendMessageUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversations: ConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messages: MessageRepository,
    @Inject(ROOM_REPOSITORY)
    private readonly rooms: RoomRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async execute(input: SendMessageInput): Promise<Message> {
    const { conversationId, authenticatedUser, texto } = input;
    const trimmed = this.sanitizeText(texto);

    await this.assertCanSend(conversationId, authenticatedUser);

    return this.messages.create(conversationId, authenticatedUser.id, trimmed);
  }

  private sanitizeText(texto: string): string {
    const trimmed = typeof texto === 'string' ? texto.trim() : '';
    if (!trimmed || trimmed.length === 0) {
      throw new InvalidRequestError('A mensagem não pode ser vazia.');
    }
    if (trimmed.length > 2000) {
      throw new InvalidRequestError('A mensagem deve ter no máximo 2000 caracteres.');
    }
    return trimmed;
  }

  private async assertCanSend(
    conversationId: string,
    user: { id: string; type: UserType },
  ): Promise<void> {
    const conversation = await this.loadConversation(conversationId, user.id);
    const room = await this.roomAccess.assertMemberCanAccessRoom(conversation.roomId, user);
    if (!room.active) {
      throw new ForbiddenError('Não é possível enviar mensagens em uma sala desativada.');
    }
    await this.assertActiveMembership(room, conversation.roomId, user);
  }

  private async loadConversation(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversations.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversa não encontrada.');
    }
    if (conversation.tutorId !== userId && conversation.studentId !== userId) {
      throw new ForbiddenError('Você não tem permissão para enviar mensagens nesta conversa.');
    }
    return conversation;
  }

  private async assertActiveMembership(
    room: Room,
    roomId: string,
    user: { id: string; type: UserType },
  ): Promise<void> {
    if (user.type === UserType.TUTOR) {
      const isTutor = room.tutorId === user.id || (await this.rooms.hasTutor(roomId, user.id));
      if (!isTutor) {
        throw new ForbiddenError('Você não possui mais vínculo de professor nesta sala.');
      }
      return;
    }

    const isStudent = await this.rooms.hasStudent(roomId, user.id);
    if (!isStudent) {
      throw new ForbiddenError('Você não possui mais vínculo de discente nesta sala.');
    }
  }
}
