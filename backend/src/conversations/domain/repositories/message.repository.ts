import type { Message } from '../entities/message.entity';

export interface ListMessagesOptions {
  cursor?: string;
  afterId?: string;
  limit: number;
}

export interface ListMessagesResult {
  messages: Message[];
  nextCursor: string | null;
}

export interface MessageRepository {
  create(conversationId: string, senderId: string, text: string): Promise<Message>;
  listByConversation(
    conversationId: string,
    options: ListMessagesOptions,
  ): Promise<ListMessagesResult>;
  findById(id: string): Promise<Message | null>;
}

export const MESSAGE_REPOSITORY = Symbol('MessageRepository');
