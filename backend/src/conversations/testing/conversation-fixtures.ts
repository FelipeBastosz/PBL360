import { UserType } from '@/users/domain/enums/user-type.enum';
import type { ConversationRepository } from '../domain/repositories/conversation.repository';
import type { MessageRepository } from '../domain/repositories/message.repository';
import type { UserRepository } from '@/users/domain/repositories/user.repository';
import { Conversation } from '../domain/entities/conversation.entity';
import { Message } from '../domain/entities/message.entity';
import { User } from '@/users/domain/entities/user.entity';

export const TUTOR_ID = '11111111-1111-4111-8111-111111111111';
export const STUDENT_ID = '22222222-2222-4222-8222-222222222222';
export const ROOM_ID = '33333333-3333-4333-8333-333333333333';
export const CONVERSATION_ID = '44444444-4444-4444-8444-444444444444';
export const MESSAGE_ID = '55555555-5555-4555-8555-555555555555';

export const buildUser = (overrides: Partial<User> = {}): User => {
  const user = new User();
  user.id = overrides.id ?? TUTOR_ID;
  user.name = overrides.name ?? 'Carlos Mendes';
  user.email = overrides.email ?? 'carlos@uefs.br';
  user.type = overrides.type ?? UserType.TUTOR;
  user.active = overrides.active ?? true;
  user.hasPhoto = overrides.hasPhoto ?? false;
  return Object.assign(user, overrides);
};

export const buildConversation = (overrides: Partial<Conversation> = {}): Conversation => {
  const conversation = new Conversation();
  conversation.id = overrides.id ?? CONVERSATION_ID;
  conversation.roomId = overrides.roomId ?? ROOM_ID;
  conversation.tutorId = overrides.tutorId ?? TUTOR_ID;
  conversation.studentId = overrides.studentId ?? STUDENT_ID;
  conversation.createdAt = overrides.createdAt ?? new Date('2026-11-12T10:00:00Z');
  conversation.updatedAt = overrides.updatedAt ?? new Date('2026-11-12T10:00:00Z');
  return Object.assign(conversation, overrides);
};

export const buildMessage = (overrides: Partial<Message> = {}): Message => {
  const message = new Message();
  message.id = overrides.id ?? MESSAGE_ID;
  message.conversationId = overrides.conversationId ?? CONVERSATION_ID;
  message.senderId = overrides.senderId ?? TUTOR_ID;
  message.text = overrides.text ?? 'Olá aluno!';
  message.sentAt = overrides.sentAt ?? new Date('2026-11-12T10:05:00Z');

  const sender = new User();
  sender.id = message.senderId;
  sender.name = 'Carlos Mendes';
  message.sender = overrides.sender ?? sender;

  return Object.assign(message, overrides);
};

export const conversationRepositoryStub = (): jest.Mocked<ConversationRepository> => ({
  findById: jest.fn(),
  findByRoomTutorAndStudent: jest.fn(),
  findOrCreate: jest.fn(),
  listByRoomAndUser: jest.fn(),
});

export const messageRepositoryStub = (): jest.Mocked<MessageRepository> => ({
  create: jest.fn(),
  listByConversation: jest.fn(),
  findById: jest.fn(),
});

export const userRepositoryStub = (): jest.Mocked<UserRepository> => ({
  searchTutors: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  updateName: jest.fn(),
  save: jest.fn(),
  saveWithTermAcceptance: jest.fn(),
});

export const conversationAccessServiceStub = () => ({
  assertCanAccess: jest.fn(),
  assertCanSend: jest.fn(),
});
