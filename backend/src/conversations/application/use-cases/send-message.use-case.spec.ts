import { InvalidRequestError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  buildMessage,
  CONVERSATION_ID,
  conversationAccessServiceStub,
  messageRepositoryStub,
  TUTOR_ID,
} from '../../testing/conversation-fixtures';
import { SendMessageUseCase } from './send-message.use-case';
import type { ConversationAccessService } from '../services/conversation-access.service';

describe('SendMessageUseCase', () => {
  let accessService: ReturnType<typeof conversationAccessServiceStub>;
  let messages: ReturnType<typeof messageRepositoryStub>;
  let useCase: SendMessageUseCase;

  beforeEach(() => {
    accessService = conversationAccessServiceStub();
    messages = messageRepositoryStub();

    useCase = new SendMessageUseCase(
      accessService as unknown as ConversationAccessService,
      messages,
    );
  });

  it.each(['', '   ', '\u200B\u200C\u200D\uFEFF', null, undefined])(
    'throws InvalidRequestError when message text is empty or only whitespace/invisible chars: %p',
    async (emptyText) => {
      await expect(
        useCase.execute({
          conversationId: CONVERSATION_ID,
          authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
          text: emptyText as unknown as string,
        }),
      ).rejects.toBeInstanceOf(InvalidRequestError);
    },
  );

  it('throws InvalidRequestError when message exceeds 2000 characters', async () => {
    const longText = 'a'.repeat(2001);

    await expect(
      useCase.execute({
        conversationId: CONVERSATION_ID,
        authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
        text: longText,
      }),
    ).rejects.toBeInstanceOf(InvalidRequestError);
  });

  it('accepts message with 1500 emojis even if UTF-16 length exceeds 2000', async () => {
    const emojiText = '😀'.repeat(1500);
    const created = buildMessage({ text: emojiText });
    messages.create.mockResolvedValue(created);

    const result = await useCase.execute({
      conversationId: CONVERSATION_ID,
      authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
      text: emojiText,
    });

    expect(result).toBe(created);
    expect(messages.create).toHaveBeenCalledWith(CONVERSATION_ID, TUTOR_ID, emojiText);
  });

  it('accepts message with exactly 2000 characters', async () => {
    const maxText = 'x'.repeat(2000);
    const created = buildMessage({ text: maxText });
    messages.create.mockResolvedValue(created);

    const result = await useCase.execute({
      conversationId: CONVERSATION_ID,
      authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
      text: maxText,
    });

    expect(result).toBe(created);
    expect(messages.create).toHaveBeenCalledWith(CONVERSATION_ID, TUTOR_ID, maxText);
  });

  it('strips invisible zero-width characters and whitespace from message text', async () => {
    const raw = '\u200B  Olá mundo!  \u200D';
    const created = buildMessage({ text: 'Olá mundo!' });
    messages.create.mockResolvedValue(created);

    const result = await useCase.execute({
      conversationId: CONVERSATION_ID,
      authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
      text: raw,
    });

    expect(result).toBe(created);
    expect(messages.create).toHaveBeenCalledWith(CONVERSATION_ID, TUTOR_ID, 'Olá mundo!');
  });

  it('delegates validation to accessService.assertCanSend', async () => {
    const created = buildMessage({ text: 'Olá!' });
    messages.create.mockResolvedValue(created);

    await useCase.execute({
      conversationId: CONVERSATION_ID,
      authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
      text: 'Olá!',
    });

    expect(accessService.assertCanSend).toHaveBeenCalledWith(CONVERSATION_ID, {
      id: TUTOR_ID,
      type: UserType.TUTOR,
    });
  });
});
