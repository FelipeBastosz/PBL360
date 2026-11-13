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

export interface ListConversationMessagesInput {
  conversationId: string;
  authenticatedUser: {
    id: string;
    type: UserType;
  };
  query: {
    cursor?: string;
    afterId?: string;
    limit?: number;
  };
}

export interface ListConversationMessagesOutput {
  messages: Message[];
  nextCursor: string | null;
}

@Injectable()
export class ListConversationMessagesUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversations: ConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messages: MessageRepository,
    @Inject(ROOM_REPOSITORY)
    private readonly rooms: RoomRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async execute(input: ListConversationMessagesInput): Promise<ListConversationMessagesOutput> {
    const { conversationId, authenticatedUser, query } = input;

    if (query.cursor && query.afterId) {
      throw new InvalidRequestError('Não é possível utilizar cursor e apos simultaneamente.');
    }

    await this.assertAccess(conversationId, authenticatedUser);
    const limit = Math.min(Math.max(query.limit ?? 30, 1), 50);

    return this.messages.listByConversation(conversationId, {
      cursor: query.cursor,
      afterId: query.afterId,
      limit,
    });
  }

  private async assertAccess(
    conversationId: string,
    user: { id: string; type: UserType },
  ): Promise<void> {
    const conversation = await this.loadConversation(conversationId, user.id);
    const room = await this.roomAccess.assertMemberCanAccessRoom(conversation.roomId, user);
    await this.assertActiveMembership(room, conversation.roomId, user);
  }

  private async loadConversation(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversations.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversa não encontrada.');
    }
    if (conversation.tutorId !== userId && conversation.studentId !== userId) {
      throw new ForbiddenError('Você não tem permissão para acessar esta conversa.');
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
