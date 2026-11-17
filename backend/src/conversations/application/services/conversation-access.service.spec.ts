import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { buildRoom, roomAccessStub, roomRepositoryStub } from '@/rooms/testing/room-fixtures';
import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  buildConversation,
  CONVERSATION_ID,
  conversationRepositoryStub,
  ROOM_ID,
  STUDENT_ID,
  TUTOR_ID,
} from '../../testing/conversation-fixtures';
import { ConversationAccessService } from './conversation-access.service';

describe('ConversationAccessService', () => {
  let conversations: ReturnType<typeof conversationRepositoryStub>;
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let roomAccess: ReturnType<typeof roomAccessStub>;
  let service: ConversationAccessService;

  beforeEach(() => {
    conversations = conversationRepositoryStub();
    rooms = roomRepositoryStub();
    roomAccess = roomAccessStub();

    service = new ConversationAccessService(
      conversations,
      rooms,
      roomAccess as unknown as RoomAccessService,
    );
  });

  describe('assertCanAccess', () => {
    it('throws NotFoundError when conversation does not exist', async () => {
      conversations.findById.mockResolvedValue(null);

      await expect(
        service.assertCanAccess(CONVERSATION_ID, { id: TUTOR_ID, type: UserType.TUTOR }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws ForbiddenError when user is not participant in conversation', async () => {
      conversations.findById.mockResolvedValue(buildConversation());

      await expect(
        service.assertCanAccess(CONVERSATION_ID, { id: 'other-user', type: UserType.STUDENT }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('delegates to roomAccess and returns conversation and room on success', async () => {
      const conv = buildConversation();
      const room = buildRoom({ id: ROOM_ID, active: true, tutorId: TUTOR_ID });
      conversations.findById.mockResolvedValue(conv);
      roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);

      const result = await service.assertCanAccess(CONVERSATION_ID, {
        id: TUTOR_ID,
        type: UserType.TUTOR,
      });

      expect(result).toEqual({ conversation: conv, room });
      expect(roomAccess.assertMemberCanAccessRoom).toHaveBeenCalledWith(conv.roomId, {
        id: TUTOR_ID,
        type: UserType.TUTOR,
      });
    });
  });

  describe('assertCanSend', () => {
    it('throws ForbiddenError when the room is inactive', async () => {
      conversations.findById.mockResolvedValue(buildConversation());
      const room = buildRoom({ id: ROOM_ID, active: false, tutorId: TUTOR_ID });
      roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);

      await expect(
        service.assertCanSend(CONVERSATION_ID, { id: TUTOR_ID, type: UserType.TUTOR }),
      ).rejects.toThrow('Não é possível enviar mensagens em uma sala desativada.');
    });

    it('throws ForbiddenError when sender is tutor and recipient student left room', async () => {
      conversations.findById.mockResolvedValue(buildConversation());
      const room = buildRoom({ id: ROOM_ID, active: true, tutorId: TUTOR_ID });
      roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);
      rooms.hasStudent.mockResolvedValue(false);

      await expect(
        service.assertCanSend(CONVERSATION_ID, { id: TUTOR_ID, type: UserType.TUTOR }),
      ).rejects.toThrow('O destinatário não possui mais vínculo com esta sala.');
    });

    it('succeeds when sender is tutor and recipient student is in room', async () => {
      const conv = buildConversation();
      const room = buildRoom({ id: ROOM_ID, active: true, tutorId: TUTOR_ID });
      conversations.findById.mockResolvedValue(conv);
      roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);
      rooms.hasStudent.mockResolvedValue(true);

      const result = await service.assertCanSend(CONVERSATION_ID, {
        id: TUTOR_ID,
        type: UserType.TUTOR,
      });

      expect(result.conversation).toBe(conv);
      expect(rooms.hasStudent).toHaveBeenCalledWith(ROOM_ID, STUDENT_ID);
    });

    it('throws ForbiddenError when sender is student and recipient tutor left room', async () => {
      const conv = buildConversation({ tutorId: 'co-tutor-id' });
      const room = buildRoom({ id: ROOM_ID, active: true, tutorId: TUTOR_ID });
      conversations.findById.mockResolvedValue(conv);
      roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);
      rooms.hasTutor.mockResolvedValue(false);

      await expect(
        service.assertCanSend(CONVERSATION_ID, { id: STUDENT_ID, type: UserType.STUDENT }),
      ).rejects.toThrow('O destinatário não possui mais vínculo com esta sala.');
    });

    it('succeeds when sender is student and recipient tutor is co-tutor', async () => {
      const conv = buildConversation({ tutorId: 'co-tutor-id' });
      const room = buildRoom({ id: ROOM_ID, active: true, tutorId: TUTOR_ID });
      conversations.findById.mockResolvedValue(conv);
      roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);
      rooms.hasTutor.mockResolvedValue(true);

      const result = await service.assertCanSend(CONVERSATION_ID, {
        id: STUDENT_ID,
        type: UserType.STUDENT,
      });

      expect(result.conversation).toBe(conv);
      expect(rooms.hasTutor).toHaveBeenCalledWith(ROOM_ID, 'co-tutor-id');
    });

    it('succeeds when sender is student and recipient tutor is room owner', async () => {
      const conv = buildConversation({ tutorId: TUTOR_ID });
      const room = buildRoom({ id: ROOM_ID, active: true, tutorId: TUTOR_ID });
      conversations.findById.mockResolvedValue(conv);
      roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);

      const result = await service.assertCanSend(CONVERSATION_ID, {
        id: STUDENT_ID,
        type: UserType.STUDENT,
      });

      expect(result.conversation).toBe(conv);
      expect(rooms.hasTutor).not.toHaveBeenCalled();
    });
  });
});
