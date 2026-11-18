import { Inject, Injectable } from '@nestjs/common';
import { InvalidRequestError, NotFoundError } from '@/shared/errors/application.error';
import type { UserType } from '@/users/domain/enums/user-type.enum';
import {
  MESSAGE_REPOSITORY,
  type MessageRepository,
} from '../../domain/repositories/message.repository';
import type { Message } from '../../domain/entities/message.entity';
import { ConversationAccessService } from '../services/conversation-access.service';

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
    private readonly accessService: ConversationAccessService,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messages: MessageRepository,
  ) {}

  async execute(input: ListConversationMessagesInput): Promise<ListConversationMessagesOutput> {
    const { conversationId, authenticatedUser, query } = input;

    if (query.cursor && query.afterId) {
      throw new InvalidRequestError('Não é possível utilizar cursor e apos simultaneamente.');
    }

    await this.accessService.assertCanAccess(conversationId, authenticatedUser);
    await this.validateReference(conversationId, query.cursor, query.afterId);

    const limit = Math.min(Math.max(query.limit ?? 30, 1), 50);

    return this.messages.listByConversation(conversationId, {
      cursor: query.cursor,
      afterId: query.afterId,
      limit,
    });
  }

  private async validateReference(
    conversationId: string,
    cursor?: string,
    afterId?: string,
  ): Promise<void> {
    const referenceId = cursor ?? afterId;
    if (!referenceId) {
      return;
    }
    const paramName = cursor ? 'cursor' : 'apos';
    const message = await this.messages.findById(referenceId);
    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundError(
        `Mensagem de referência (${paramName}) não encontrada nesta conversa.`,
      );
    }
  }
}
