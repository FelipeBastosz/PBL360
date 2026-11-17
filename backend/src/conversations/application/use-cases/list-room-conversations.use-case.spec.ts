import { ForbiddenError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { roomAccessStub } from '@/rooms/testing/room-fixtures';
import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  CONVERSATION_ID,
  conversationRepositoryStub,
  ROOM_ID,
  TUTOR_ID,
} from '../../testing/conversation-fixtures';
import { ListRoomConversationsUseCase } from './list-room-conversations.use-case';

describe('ListRoomConversationsUseCase', () => {
  let conversations: ReturnType<typeof conversationRepositoryStub>;
  let roomAccess: ReturnType<typeof roomAccessStub>;
  let useCase: ListRoomConversationsUseCase;

  beforeEach(() => {
    conversations = conversationRepositoryStub();
    roomAccess = roomAccessStub();

    useCase = new ListRoomConversationsUseCase(
      conversations,
      roomAccess as unknown as RoomAccessService,
    );
  });

  it('propagates error if user cannot access the room', async () => {
    roomAccess.assertMemberCanAccessRoom.mockRejectedValue(new ForbiddenError('Sem acesso'));

    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns conversations list for the authenticated user in the room', async () => {
    const list = [
      {
        id: CONVERSATION_ID,
        interlocutor: {
          id: 'student-1',
          name: 'Ana',
          type: UserType.STUDENT,
          hasPhoto: false,
        },
        lastMessage: {
          text: 'Olá',
          sentAt: new Date(),
        },
      },
    ];

    conversations.listByRoomAndUser.mockResolvedValue(list);

    const result = await useCase.execute({
      roomId: ROOM_ID,
      authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
    });

    expect(result).toBe(list);
    expect(conversations.listByRoomAndUser).toHaveBeenCalledWith(ROOM_ID, TUTOR_ID);
  });
});
