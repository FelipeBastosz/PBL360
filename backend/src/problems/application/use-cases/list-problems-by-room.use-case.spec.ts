import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';

import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { Room } from '@/rooms/domain/entities/room.entity';

import { Problem } from '../../domain/entities/problem.entity';
import type { ProblemRepository } from '../../domain/repositories/problem.repository';
import { ListProblemsByRoomUseCase } from './list-problems-by-room.use-case';

describe('ListProblemsByRoomUseCase', () => {
  let useCase: ListProblemsByRoomUseCase;
  let findByRoomIdMock: jest.Mock;
  let assertMemberCanAccessRoomMock: jest.Mock;

  const tutorMember = { id: 'tutor-1', type: UserType.TUTOR };
  const studentMember = { id: 'student-1', type: UserType.STUDENT };

  beforeEach(() => {
    findByRoomIdMock = jest.fn();
    assertMemberCanAccessRoomMock = jest.fn();

    const problemRepository: jest.Mocked<ProblemRepository> = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByRoomId: findByRoomIdMock,
    };

    const roomAccessService = {
      assertMemberCanAccessRoom: assertMemberCanAccessRoomMock,
      assertTutorCanAccessRoom: jest.fn(),
      assertTutorIsRoomOwner: jest.fn(),
    } as unknown as jest.Mocked<RoomAccessService>;

    useCase = new ListProblemsByRoomUseCase(problemRepository, roomAccessService);
  });

  it('rejects when room is not found', async () => {
    assertMemberCanAccessRoomMock.mockRejectedValueOnce(new NotFoundError('Sala não encontrada.'));

    await expect(
      useCase.execute({ roomId: 'non-existent-room', member: tutorMember }),
    ).rejects.toThrow(NotFoundError);

    expect(findByRoomIdMock).not.toHaveBeenCalled();
  });

  it('rejects when member does not have access to the room', async () => {
    assertMemberCanAccessRoomMock.mockRejectedValueOnce(
      new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
    );

    await expect(useCase.execute({ roomId: 'room-1', member: tutorMember })).rejects.toThrow(
      ForbiddenError,
    );

    expect(findByRoomIdMock).not.toHaveBeenCalled();
  });

  it('returns an empty array when the room has no problems', async () => {
    assertMemberCanAccessRoomMock.mockResolvedValueOnce(new Room());
    findByRoomIdMock.mockResolvedValueOnce([]);

    const result = await useCase.execute({ roomId: 'empty-room', member: studentMember });

    expect(result).toEqual([]);
    expect(assertMemberCanAccessRoomMock).toHaveBeenCalledWith('empty-room', studentMember);
    expect(findByRoomIdMock).toHaveBeenCalledWith('empty-room');
  });

  it('returns the list of problems for the given room in order', async () => {
    assertMemberCanAccessRoomMock.mockResolvedValueOnce(new Room());

    const problem1 = Problem.create({
      roomId: 'room-1',
      title: 'Problema 1',
      orderIndex: 1,
      createdBy: 'tutor-1',
    });
    const problem2 = Problem.create({
      roomId: 'room-1',
      title: 'Problema 2',
      orderIndex: 2,
      createdBy: 'tutor-1',
    });

    findByRoomIdMock.mockResolvedValueOnce([problem1, problem2]);

    const result = await useCase.execute({ roomId: 'room-1', member: studentMember });

    expect(result).toHaveLength(2);
    expect(result[0]?.title).toBe('Problema 1');
    expect(result[1]?.title).toBe('Problema 2');
    expect(result[0]?.orderIndex).toBe(1);
    expect(result[1]?.orderIndex).toBe(2);
  });
});
