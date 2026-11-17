import { InvalidRequestError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  buildMessage,
  CONVERSATION_ID,
  conversationAccessServiceStub,
  messageRepositoryStub,
  TUTOR_ID,
} from '../../testing/conversation-fixtures';
import { ListConversationMessagesUseCase } from './list-conversation-messages.use-case';
import type { ConversationAccessService } from '../services/conversation-access.service';

describe('ListConversationMessagesUseCase', () => {
  let accessService: ReturnType<typeof conversationAccessServiceStub>;
  let messages: ReturnType<typeof messageRepositoryStub>;
  let useCase: ListConversationMessagesUseCase;

  beforeEach(() => {
    accessService = conversationAccessServiceStub();
    messages = messageRepositoryStub();

    useCase = new ListConversationMessagesUseCase(
      accessService as unknown as ConversationAccessService,
      messages,
    );
  });

  it('throws InvalidRequestError when both cursor and apos are provided', async () => {
    await expect(
      useCase.execute({
        conversationId: CONVERSATION_ID,
        authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
        query: { cursor: 'cursor-id', afterId: 'apos-id' },
      }),
    ).rejects.toBeInstanceOf(InvalidRequestError);
  });

  it('delegates access validation to accessService.assertCanAccess', async () => {
    messages.listByConversation.mockResolvedValue({ messages: [], nextCursor: null });

    await useCase.execute({
      conversationId: CONVERSATION_ID,
      authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
      query: {},
    });

    expect(accessService.assertCanAccess).toHaveBeenCalledWith(CONVERSATION_ID, {
      id: TUTOR_ID,
      type: UserType.TUTOR,
    });
  });

  it('uses default limit of 30 when limit is undefined', async () => {
    messages.listByConversation.mockResolvedValue({ messages: [], nextCursor: null });

    await useCase.execute({
      conversationId: CONVERSATION_ID,
      authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
      query: {},
    });

    expect(messages.listByConversation).toHaveBeenCalledWith(CONVERSATION_ID, {
      cursor: undefined,
      afterId: undefined,
      limit: 30,
    });
  });

  it('clamps limit to maximum 50', async () => {
    messages.listByConversation.mockResolvedValue({ messages: [], nextCursor: null });

    await useCase.execute({
      conversationId: CONVERSATION_ID,
      authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
      query: { limit: 100 },
    });

    expect(messages.listByConversation).toHaveBeenCalledWith(CONVERSATION_ID, {
      cursor: undefined,
      afterId: undefined,
      limit: 50,
    });
  });

  it('throws NotFoundError when cursor does not exist', async () => {
    messages.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        conversationId: CONVERSATION_ID,
        authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
        query: { cursor: 'missing-id' },
      }),
    ).rejects.toThrow('Mensagem de referência (cursor) não encontrada nesta conversa.');
  });

  it('throws NotFoundError when cursor belongs to another conversation', async () => {
    const foreignMessage = buildMessage({
      id: 'foreign-msg',
      conversationId: 'different-conversation-id',
    });
    messages.findById.mockResolvedValue(foreignMessage);

    await expect(
      useCase.execute({
        conversationId: CONVERSATION_ID,
        authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
        query: { cursor: 'foreign-msg' },
      }),
    ).rejects.toThrow('Mensagem de referência (cursor) não encontrada nesta conversa.');
  });

  it('throws NotFoundError when apos does not exist', async () => {
    messages.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        conversationId: CONVERSATION_ID,
        authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
        query: { afterId: 'missing-apos' },
      }),
    ).rejects.toThrow('Mensagem de referência (apos) não encontrada nesta conversa.');
  });

  it('returns messages and pagination cursor for valid query', async () => {
    const validRef = buildMessage({ id: 'ref-msg', conversationId: CONVERSATION_ID });
    messages.findById.mockResolvedValue(validRef);

    const messageList = [buildMessage()];
    messages.listByConversation.mockResolvedValue({
      messages: messageList,
      nextCursor: 'next-id',
    });

    const result = await useCase.execute({
      conversationId: CONVERSATION_ID,
      authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
      query: { cursor: 'ref-msg', limit: 20 },
    });

    expect(result.messages).toBe(messageList);
    expect(result.nextCursor).toBe('next-id');
    expect(messages.listByConversation).toHaveBeenCalledWith(CONVERSATION_ID, {
      cursor: 'ref-msg',
      afterId: undefined,
      limit: 20,
    });
  });
});
