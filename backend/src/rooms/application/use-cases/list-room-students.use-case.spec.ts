import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { roomAccessStub, roomRepositoryStub } from '../../testing/room-fixtures';
import type { RoomAccessService } from '../services/room-access.service';
import { ListRoomStudentsUseCase } from './list-room-students.use-case';

describe('ListRoomStudentsUseCase', () => {
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let access: ReturnType<typeof roomAccessStub>;
  let useCase: ListRoomStudentsUseCase;

  beforeEach(() => {
    rooms = roomRepositoryStub();
    access = roomAccessStub();
    useCase = new ListRoomStudentsUseCase(rooms, access as unknown as RoomAccessService);
  });

  it('returns student data after member access is granted', async () => {
    const tutorId = 'tutor-id';
    const students = [
      {
        name: 'Ana Souza',
        joinedAt: new Date('2026-01-01'),
      },
    ];
    rooms.findStudents.mockResolvedValue(students);

    await expect(useCase.execute('room-id', tutorId)).resolves.toEqual(students);
    expect(access.assertTutorCanAccessRoom).toHaveBeenCalledWith('room-id', tutorId);
    expect(rooms.findStudents).toHaveBeenCalledWith('room-id');
  });

  it.each([new ForbiddenError('negado'), new NotFoundError('Sala não encontrada.')])(
    'does not list students when room access is denied: %p',
    async (error) => {
      access.assertTutorCanAccessRoom.mockRejectedValue(error);

      await expect(useCase.execute('room-id', 'other-user-id')).rejects.toBe(error);
      expect(rooms.findStudents).not.toHaveBeenCalled();
    },
  );
});
