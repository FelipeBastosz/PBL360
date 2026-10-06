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
    const member = { id: 'tutor-id', type: 'TUTOR' as const };
    const students = [
      {
        id: 'student-id',
        name: 'Ana Souza',
        joinedAt: new Date('2026-01-01'),
        email: 'ana@discente.uefs.br',
        registrationNumber: '20240001',
      },
    ];
    rooms.findStudents.mockResolvedValue(students);

    await expect(useCase.execute({ roomId: 'room-id', member })).resolves.toEqual(students);
    expect(access.assertMemberCanAccessRoom).toHaveBeenCalledWith('room-id', member);
    expect(rooms.findStudents).toHaveBeenCalledWith('room-id');
  });

  it.each([new ForbiddenError('negado'), new NotFoundError('Sala não encontrada.')])(
    'does not list students when room access is denied: %p',
    async (error) => {
      access.assertMemberCanAccessRoom.mockRejectedValue(error);

      await expect(
        useCase.execute({ roomId: 'room-id', member: { id: 'other-user-id', type: 'STUDENT' } }),
      ).rejects.toBe(error);
      expect(rooms.findStudents).not.toHaveBeenCalled();
    },
  );
});
