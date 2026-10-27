import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import {
  buildRoom,
  OWNER_ID,
  ROOM_ID,
  roomRepositoryStub,
} from '../../testing/room-fixtures';
import { LeaveRoomUseCase, OWNER_CANNOT_LEAVE_MESSAGE } from './leave-room.use-case';

describe('LeaveRoomUseCase', () => {
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let useCase: LeaveRoomUseCase;

  beforeEach(() => {
    rooms = roomRepositoryStub();
    rooms.findById.mockResolvedValue(buildRoom());
    useCase = new LeaveRoomUseCase(rooms);
  });

  it('allows a student to leave the room', async () => {
    const studentId = 'student-1';
    rooms.hasStudent.mockResolvedValue(true);
    rooms.removeStudent.mockResolvedValue(true);

    await useCase.execute({ roomId: ROOM_ID, userId: studentId });

    expect(rooms.removeStudent).toHaveBeenCalledWith(ROOM_ID, studentId);
    expect(rooms.removeTutor).not.toHaveBeenCalled();
  });

  it('allows a co-tutor to leave the room', async () => {
    const coTutorId = 'co-tutor-1';
    rooms.hasStudent.mockResolvedValue(false);
    rooms.hasTutor.mockResolvedValue(true);
    rooms.removeTutor.mockResolvedValue(true);

    await useCase.execute({ roomId: ROOM_ID, userId: coTutorId });

    expect(rooms.removeTutor).toHaveBeenCalledWith(ROOM_ID, coTutorId);
    expect(rooms.removeStudent).not.toHaveBeenCalled();
  });

  it('prevents the responsible tutor (owner) from leaving the room with ConflictError', async () => {
    await expect(useCase.execute({ roomId: ROOM_ID, userId: OWNER_ID })).rejects.toThrow(
      new ConflictError(OWNER_CANNOT_LEAVE_MESSAGE),
    );

    expect(rooms.removeStudent).not.toHaveBeenCalled();
    expect(rooms.removeTutor).not.toHaveBeenCalled();
  });

  it('rejects an unlinked user with ForbiddenError', async () => {
    const outsiderId = 'outsider-1';
    rooms.hasStudent.mockResolvedValue(false);
    rooms.hasTutor.mockResolvedValue(false);

    await expect(useCase.execute({ roomId: ROOM_ID, userId: outsiderId })).rejects.toThrow(
      new ForbiddenError('Você não participa desta sala.'),
    );

    expect(rooms.removeStudent).not.toHaveBeenCalled();
    expect(rooms.removeTutor).not.toHaveBeenCalled();
  });

  it('throws NotFoundError if the room does not exist', async () => {
    rooms.findById.mockResolvedValue(null);

    await expect(useCase.execute({ roomId: 'missing-room', userId: 'user-1' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('throws NotFoundError if the room was deleted', async () => {
    const deletedRoom = buildRoom();
    deletedRoom.delete();
    rooms.findById.mockResolvedValue(deletedRoom);

    await expect(useCase.execute({ roomId: ROOM_ID, userId: 'user-1' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
