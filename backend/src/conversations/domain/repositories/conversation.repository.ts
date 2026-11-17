import type { UserType } from '@/users/domain/enums/user-type.enum';
import type { Conversation } from '../entities/conversation.entity';

export interface ConversationInterlocutor {
  id: string;
  name: string;
  type: UserType;
  hasPhoto: boolean;
}

export interface ConversationLastMessage {
  text: string;
  sentAt: Date;
}

export interface ConversationListItem {
  id: string;
  interlocutor: ConversationInterlocutor;
  lastMessage: ConversationLastMessage | null;
}

export interface FindOrCreateConversationResult {
  conversation: Conversation;
  created: boolean;
}

export interface ConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  findByRoomTutorAndStudent(
    roomId: string,
    tutorId: string,
    studentId: string,
  ): Promise<Conversation | null>;
  findOrCreate(
    roomId: string,
    tutorId: string,
    studentId: string,
  ): Promise<FindOrCreateConversationResult>;
  listByRoomAndUser(roomId: string, userId: string): Promise<ConversationListItem[]>;
}

export const CONVERSATION_REPOSITORY = Symbol('ConversationRepository');
