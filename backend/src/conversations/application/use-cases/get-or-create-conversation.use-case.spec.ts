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
  buildUser,
  conversationRepositoryStub,
  ROOM_ID,
  STUDENT_ID,
  TUTOR_ID,
  userRepositoryStub,
} from '../../testing/conversation-fixtures';
import { GetOrCreateConversationUseCase } from './get-or-create-conversation.use-case';

describe('GetOrCreateConversationUseCase', () => {
  let conversations: ReturnType<typeof conversationRepositoryStub>;
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let users: ReturnType<typeof userRepositoryStub>;
  let roomAccess: ReturnType<typeof roomAccessStub>;
  let useCase: GetOrCreateConversationUseCase;

  beforeEach(() => {
    conversations = conversationRepositoryStub();
    rooms = roomRepositoryStub();
    users = userRepositoryStub();
    roomAccess = roomAccessStub();

    useCase = new GetOrCreateConversationUseCase(
      conversations,
      rooms,
      users,
      roomAccess as unknown as RoomAccessService,
    );
  });

  it('throws InvalidRequestError when user tries to initiate a conversation with themselves', async () => {
    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
        recipientId: TUTOR_ID,
      }),
    ).rejects.toBeInstanceOf(InvalidRequestError);
  });

  it('throws NotFoundError when recipient does not exist or is inactive', async () => {
    roomAccess.assertMemberCanAccessRoom.mockResolvedValue(buildRoom());
    users.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
        recipientId: STUDENT_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws InvalidRequestError when both participants are tutors', async () => {
    roomAccess.assertMemberCanAccessRoom.mockResolvedValue(buildRoom());
    users.findById.mockResolvedValue(buildUser({ id: 'tutor-2', type: UserType.TUTOR }));

    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
        recipientId: 'tutor-2',
      }),
    ).rejects.toThrow('Conversas só são permitidas entre um professor e um aluno.');
  });

  it('throws InvalidRequestError when both participants are students', async () => {
    roomAccess.assertMemberCanAccessRoom.mockResolvedValue(buildRoom());
    users.findById.mockResolvedValue(buildUser({ id: 'student-2', type: UserType.STUDENT }));

    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedUser: { id: STUDENT_ID, type: UserType.STUDENT },
        recipientId: 'student-2',
      }),
    ).rejects.toThrow('Conversas só são permitidas entre um professor e um aluno.');
  });

  it('throws ForbiddenError when tutor tries to chat with student who is not in the room', async () => {
    roomAccess.assertMemberCanAccessRoom.mockResolvedValue(buildRoom());
    users.findById.mockResolvedValue(buildUser({ id: STUDENT_ID, type: UserType.STUDENT }));
    rooms.hasStudent.mockResolvedValue(false);

    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
        recipientId: STUDENT_ID,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws ForbiddenError when student tries to chat with tutor who is not in the room', async () => {
    const room = buildRoom({ tutorId: 'different-tutor' });
    roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);
    users.findById.mockResolvedValue(buildUser({ id: TUTOR_ID, type: UserType.TUTOR }));
    rooms.hasTutor.mockResolvedValue(false);

    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedUser: { id: STUDENT_ID, type: UserType.STUDENT },
        recipientId: TUTOR_ID,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns existing conversation with created=false if already present', async () => {
    const room = buildRoom({ tutorId: TUTOR_ID });
    roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);
    const student = buildUser({ id: STUDENT_ID, name: 'Ana', type: UserType.STUDENT });
    users.findById.mockResolvedValue(student);
    rooms.hasStudent.mockResolvedValue(true);

    const existingConversation = buildConversation();
    conversations.findByRoomTutorAndStudent.mockResolvedValue(existingConversation);

    const result = await useCase.execute({
      roomId: ROOM_ID,
      authenticatedUser: { id: TUTOR_ID, type: UserType.TUTOR },
      recipientId: STUDENT_ID,
    });

    expect(result.created).toBe(false);
    expect(result.conversation).toBe(existingConversation);
    expect(result.interlocutor.id).toBe(STUDENT_ID);
    expect(conversations.create).not.toHaveBeenCalled();
  });

  it('creates new conversation with created=true when student initiates with tutor and none exists', async () => {
    const room = buildRoom({ tutorId: TUTOR_ID });
    roomAccess.assertMemberCanAccessRoom.mockResolvedValue(room);
    const tutor = buildUser({ id: TUTOR_ID, name: 'Carlos', type: UserType.TUTOR });
    users.findById.mockResolvedValue(tutor);

    conversations.findByRoomTutorAndStudent.mockResolvedValue(null);
    const created = buildConversation();
    conversations.create.mockResolvedValue(created);

    const result = await useCase.execute({
      roomId: ROOM_ID,
      authenticatedUser: { id: STUDENT_ID, type: UserType.STUDENT },
      recipientId: TUTOR_ID,
    });

    expect(result.created).toBe(true);
    expect(result.conversation).toBe(created);
    expect(result.interlocutor.id).toBe(TUTOR_ID);
    expect(conversations.create).toHaveBeenCalledWith(ROOM_ID, TUTOR_ID, STUDENT_ID);
  });
});
