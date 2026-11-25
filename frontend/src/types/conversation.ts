import type { UserTypePayload } from './auth';

export type ConversationInterlocutor = {
  id: string;
  nome: string;
  tipo: UserTypePayload;
  possuiFoto: boolean;
};

export type LastMessage = {
  texto: string;
  enviadaEm: string;
};

export type Conversation = {
  id: string;
  interlocutor: ConversationInterlocutor;
  ultimaMensagem?: LastMessage | null;
};

// POST /salas/:id/conversas answers without the last message.
export type OpenedConversation = Omit<Conversation, 'ultimaMensagem'>;

export type ChatMessage = {
  id: string;
  remetente: { id: string; nome: string };
  texto: string;
  enviadaEm: string;
};

export type MessagesPage = {
  itens: ChatMessage[];
  proximoCursor: string | null;
};

export type ListMessagesQuery = {
  cursor?: string;
  apos?: string;
  limite?: number;
};

export type OpenConversationPayload = {
  destinatarioId: string;
};

export type SendMessagePayload = {
  texto: string;
};
