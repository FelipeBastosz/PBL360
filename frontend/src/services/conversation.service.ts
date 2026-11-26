import type {
  ChatMessage,
  Conversation,
  ListMessagesQuery,
  MessagesPage,
  OpenedConversation,
  OpenConversationPayload,
  SendMessagePayload,
} from '@/types/conversation';
import { api } from './api';

const roomConversations = (roomId: string) => `/salas/${roomId}/conversas`;
const conversationMessages = (conversationId: string) => `/conversas/${conversationId}/mensagens`;

export const conversationService = {
  listForRoom: (roomId: string) =>
    api.get<Conversation[]>(roomConversations(roomId)).then((r) => r.data),

  // Returns the existing conversation when the pair already talked in this room.
  open: (roomId: string, payload: OpenConversationPayload) =>
    api.post<OpenedConversation>(roomConversations(roomId), payload).then((r) => r.data),

  listMessages: (conversationId: string, query: ListMessagesQuery = {}) =>
    api
      .get<MessagesPage>(conversationMessages(conversationId), { params: query })
      .then((r) => r.data),

  send: (conversationId: string, payload: SendMessagePayload) =>
    api.post<ChatMessage>(conversationMessages(conversationId), payload).then((r) => r.data),
};
