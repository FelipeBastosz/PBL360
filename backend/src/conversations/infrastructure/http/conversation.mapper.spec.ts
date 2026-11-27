import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  toConversationResponse,
  toInterlocutorResponse,
  toMessageResponse,
  toMessagesListResponse,
} from './conversation.mapper';

describe('conversation mapper', () => {
  it('maps interlocutors and both conversation last-message states', () => {
    expect(
      toInterlocutorResponse({ id: 'u1', name: 'Ana', type: UserType.STUDENT, hasPhoto: true }),
    ).toEqual({
      id: 'u1',
      nome: 'Ana',
      tipo: 'ALUNO',
      possuiFoto: true,
    });
    expect(
      toConversationResponse({
        id: 'c1',
        interlocutor: { id: 'u2', name: 'Prof', type: UserType.TUTOR, hasPhoto: false },
        lastMessage: { text: 'Olá', sentAt: new Date('2025-01-01T00:00:00Z') },
      }),
    ).toMatchObject({
      id: 'c1',
      interlocutor: { tipo: 'PROFESSOR' },
      ultimaMensagem: { texto: 'Olá' },
    });
    expect(
      toConversationResponse({
        id: 'c2',
        interlocutor: { id: 'u3', name: 'Bia', type: UserType.STUDENT, hasPhoto: false },
        lastMessage: null,
      }).ultimaMensagem,
    ).toBeNull();
  });

  it('maps messages with and without a loaded sender and preserves the cursor', () => {
    const sentAt = new Date('2025-02-01T00:00:00Z');
    expect(
      toMessageResponse({
        id: 'm1',
        senderId: 'u1',
        sender: { name: 'Ana' },
        text: 'Oi',
        sentAt,
      } as never),
    ).toEqual({ id: 'm1', remetente: { id: 'u1', nome: 'Ana' }, texto: 'Oi', enviadaEm: sentAt });
    const messages = [{ id: 'm2', senderId: 'u2', sender: null, text: 'Tudo?', sentAt } as never];
    expect(toMessagesListResponse(messages, 'cursor-2')).toEqual({
      itens: [{ id: 'm2', remetente: { id: 'u2', nome: '' }, texto: 'Tudo?', enviadaEm: sentAt }],
      proximoCursor: 'cursor-2',
    });
  });
});
