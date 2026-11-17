import { UserType } from '@/users/domain/enums/user-type.enum';
import { UserTypePayload } from '@/auth/application/dtos/user-type-payload.enum';
import type {
  ConversationResponseDto,
  InterlocutorResponseDto,
} from '../../application/dtos/conversation-response.dto';
import type {
  MessageResponseDto,
  MessagesListResponseDto,
} from '../../application/dtos/message-response.dto';
import type { ConversationListItem } from '../../domain/repositories/conversation.repository';
import type { Message } from '../../domain/entities/message.entity';

export const USER_TYPE_MAP: Record<UserType, UserTypePayload> = {
  [UserType.TUTOR]: UserTypePayload.PROFESSOR,
  [UserType.STUDENT]: UserTypePayload.ALUNO,
};

export const toInterlocutorResponse = (interlocutor: {
  id: string;
  name: string;
  type: UserType;
  hasPhoto: boolean;
}): InterlocutorResponseDto => ({
  id: interlocutor.id,
  nome: interlocutor.name,
  tipo: USER_TYPE_MAP[interlocutor.type],
  possuiFoto: interlocutor.hasPhoto,
});

export const toConversationResponse = (item: ConversationListItem): ConversationResponseDto => ({
  id: item.id,
  interlocutor: toInterlocutorResponse(item.interlocutor),
  ultimaMensagem: item.lastMessage
    ? {
        texto: item.lastMessage.text,
        enviadaEm: item.lastMessage.sentAt,
      }
    : null,
});

export const toMessageResponse = (message: Message): MessageResponseDto => ({
  id: message.id,
  remetente: {
    id: message.senderId,
    nome: message.sender?.name ?? '',
  },
  texto: message.text,
  enviadaEm: message.sentAt,
});

export const toMessagesListResponse = (
  messages: Message[],
  proximoCursor: string | null,
): MessagesListResponseDto => ({
  itens: messages.map(toMessageResponse),
  proximoCursor,
});
