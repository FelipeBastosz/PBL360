import { Inject, Injectable } from '@nestjs/common';
import { InvalidRequestError } from '@/shared/errors/application.error';
import type { UserType } from '@/users/domain/enums/user-type.enum';
import {
  MESSAGE_REPOSITORY,
  type MessageRepository,
} from '../../domain/repositories/message.repository';
import type { Message } from '../../domain/entities/message.entity';
import { ConversationAccessService } from '../services/conversation-access.service';

export interface SendMessageInput {
  conversationId: string;
  authenticatedUser: {
    id: string;
    type: UserType;
  };
  text: string;
}

@Injectable()
export class SendMessageUseCase {
  constructor(
    private readonly accessService: ConversationAccessService,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messages: MessageRepository,
  ) {}

  async execute(input: SendMessageInput): Promise<Message> {
    const { conversationId, authenticatedUser, text } = input;
    const cleaned = this.sanitizeText(text);

    await this.accessService.assertCanSend(conversationId, authenticatedUser);

    return this.messages.create(conversationId, authenticatedUser.id, cleaned);
  }

  private sanitizeText(text: string): string {
    const cleaned =
      typeof text === 'string' ? text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() : '';
    if (!cleaned || cleaned.length === 0) {
      throw new InvalidRequestError('A mensagem não pode ser vazia.');
    }
    if ([...cleaned].length > 2000) {
      throw new InvalidRequestError('A mensagem deve ter no máximo 2000 caracteres.');
    }
    return cleaned;
  }
}
