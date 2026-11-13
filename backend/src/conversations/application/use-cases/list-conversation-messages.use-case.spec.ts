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
import { ListConversationMessagesUseCase } from './list-conversation-messages.use-case';

describe('ListConversationMessagesUseCase', () => {
  let conversations: ReturnType<typeof conversationRepositoryStub>;
  let messages: ReturnType<typeof messageRepositoryStub>;
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let roomAccess: ReturnType<typeof roomAccessStub>;
  let useCase: ListConversationMessagesUseCase;

  beforeEach(() => {
    conversations = conversationRepositoryStub();
    messages = messageRepositoryStub();
    rooms = roomRepositoryStub();
    roomAccess = roomAccessStub();

    useCase = new ListConversationMessagesUseCase(
      conversations,
      messages,
      rooms,
      roomAccess as unknown as RoomAccessService,
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

  it('throws NotFoundError when conversation does not exist', async () => {
    conversations.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        conversationId: CONVERSATION_ID,
        authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
        query: {},
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ForbiddenError when user is not a participant of the conversation', async () => {
    conversations.findById.mockResolvedValue(buildConversation());

    await expect(
      useCase.execute({
        conversationId: CONVERSATION_ID,
        authenticatedUser: { id: 'other-user', type: UserType.TUTOR },
        query: {},
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws ForbiddenError when tutor has lost membership in the room', async () => {
    conversations.findById.mockResolvedValue(buildConversation());
    const room = buildRoom({ id: ROOM_ID, tutorId: 'different-tutor' });
    roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);
    rooms.hasTutor.mockResolvedValue(false);

    await expect(
      useCase.execute({
        conversationId: CONVERSATION_ID,
        authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
        query: {},
      }),
    ).rejects.toThrow('Você não possui mais vínculo de professor nesta sala.');
  });

  it('throws ForbiddenError when student has lost membership in the room', async () => {
    conversations.findById.mockResolvedValue(buildConversation());
    const room = buildRoom({ id: ROOM_ID, tutorId: TUTOR_ID });
    roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);
    rooms.hasStudent.mockResolvedValue(false);

    await expect(
      useCase.execute({
        conversationId: CONVERSATION_ID,
        authenticatedUser: { id: STUDENT_ID, type: UserType.STUDENT },
        query: {},
      }),
    ).rejects.toThrow('Você não possui mais vínculo de discente nesta sala.');
  });

  it('returns messages and pagination cursor for valid participant', async () => {
    conversations.findById.mockResolvedValue(buildConversation());
    const room = buildRoom({ id: ROOM_ID, tutorId: TUTOR_ID });
    roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);

    const messageList = [buildMessage()];
    messages.listByConversation.mockResolvedValue({
      messages: messageList,
      nextCursor: 'next-id',
    });

    const result = await useCase.execute({
      conversationId: CONVERSATION_ID,
      authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
      query: { limit: 20 },
    });

    expect(result.messages).toBe(messageList);
    expect(result.nextCursor).toBe('next-id');
    expect(messages.listByConversation).toHaveBeenCalledWith(CONVERSATION_ID, {
      cursor: undefined,
      afterId: undefined,
      limit: 20,
    });
  });
});
