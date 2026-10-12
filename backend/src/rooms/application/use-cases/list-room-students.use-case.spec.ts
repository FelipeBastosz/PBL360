import { ForbiddenError } from '@/shared/errors/application.error';
import type { RoomAccessService } from '../services/room-access.service';
import { roomRepositoryStub } from '../../testing/room-fixtures';
import { ListRoomStudentsUseCase } from './list-room-students.use-case';

describe('ListRoomStudentsUseCase', () => {
  const rooms = roomRepositoryStub();
  const roomAccess = { assertMemberCanAccessRoom: jest.fn() };
  let useCase: ListRoomStudentsUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    useCase = new ListRoomStudentsUseCase(rooms, roomAccess as unknown as RoomAccessService);
  });

  it('allows a room member and returns student profile data', async () => {
    const member = { id: 'student-1', type: 'STUDENT' as const };
    const expected = [
      {
        id: 'student-1',
        name: 'Ana',
        email: 'ana@discente.uefs.br',
        registrationNumber: '20260001',
        joinedAt: new Date('2026-10-01T12:00:00.000Z'),
      },
    ];
    rooms.findStudents.mockResolvedValue(expected);

    await expect(useCase.execute('room-1', member)).resolves.toEqual(expected);
    expect(roomAccess.assertMemberCanAccessRoom).toHaveBeenCalledWith('room-1', member);
  });

  it('does not list students when member access is denied', async () => {
    const error = new ForbiddenError('negado');
    roomAccess.assertMemberCanAccessRoom.mockRejectedValue(error);

    await expect(useCase.execute('room-1', { id: 'outsider', type: 'STUDENT' })).rejects.toBe(
      error,
    );
    expect(rooms.findStudents).not.toHaveBeenCalled();
  });
});
