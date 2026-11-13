import {
  ForbiddenError,
  InvalidRequestError,
  NotFoundError,
} from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { buildRoom, roomAccessStub, roomRepositoryStub } from '@/rooms/testing/room-fixtures';
import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  buildConversation,
  buildMessage,
  CONVERSATION_ID,
  conversationRepositoryStub,
  messageRepositoryStub,
  ROOM_ID,
  STUDENT_ID,
  TUTOR_ID,
} from '../../testing/conversation-fixtures';
import { SendMessageUseCase } from './send-message.use-case';

describe('SendMessageUseCase', () => {
  let conversations: ReturnType<typeof conversationRepositoryStub>;
  let messages: ReturnType<typeof messageRepositoryStub>;
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let roomAccess: ReturnType<typeof roomAccessStub>;
  let useCase: SendMessageUseCase;

  beforeEach(() => {
    conversations = conversationRepositoryStub();
    messages = messageRepositoryStub();
    rooms = roomRepositoryStub();
    roomAccess = roomAccessStub();

    useCase = new SendMessageUseCase(
      conversations,
      messages,
      rooms,
      roomAccess as unknown as RoomAccessService,
    );
  });

  it.each(['', '   ', null, undefined])(
    'throws InvalidRequestError when message text is empty: %p',
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

  it('throws NotFoundError when conversation does not exist', async () => {
    conversations.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        conversationId: CONVERSATION_ID,
        authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
        text: 'Olá!',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ForbiddenError when user is not participant in conversation', async () => {
    conversations.findById.mockResolvedValue(buildConversation());

    await expect(
      useCase.execute({
        conversationId: CONVERSATION_ID,
        authenticatedUser: { id: 'other-user', type: UserType.STUDENT },
        text: 'Olá!',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws ForbiddenError when the room is inactive', async () => {
    conversations.findById.mockResolvedValue(buildConversation());
    const room = buildRoom({ id: ROOM_ID, active: false, tutorId: TUTOR_ID });
    roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);

    await expect(
      useCase.execute({
        conversationId: CONVERSATION_ID,
        authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
        text: 'Olá!',
      }),
    ).rejects.toThrow('Não é possível enviar mensagens em uma sala desativada.');
  });

  it('throws ForbiddenError when student has lost membership in the room', async () => {
    conversations.findById.mockResolvedValue(buildConversation());
    const room = buildRoom({ id: ROOM_ID, active: true, tutorId: TUTOR_ID });
    roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);
    rooms.hasStudent.mockResolvedValue(false);

    await expect(
      useCase.execute({
        conversationId: CONVERSATION_ID,
        authenticatedUser: { id: STUDENT_ID, type: UserType.STUDENT },
        text: 'Olá!',
      }),
    ).rejects.toThrow('Você não possui mais vínculo de discente nesta sala.');
  });

  it('creates and returns message when input is valid', async () => {
    conversations.findById.mockResolvedValue(buildConversation());
    const room = buildRoom({ id: ROOM_ID, active: true, tutorId: TUTOR_ID });
    roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);

    const created = buildMessage({ text: 'Olá!' });
    messages.create.mockResolvedValue(created);

    const result = await useCase.execute({
      conversationId: CONVERSATION_ID,
      authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
      text: '   Olá!   ',
    });

    expect(result).toBe(created);
    expect(messages.create).toHaveBeenCalledWith(CONVERSATION_ID, TUTOR_ID, 'Olá!');
  });
});
