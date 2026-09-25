import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';

import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { Room } from '@/rooms/domain/entities/room.entity';

import { Problem } from '../../domain/entities/problem.entity';
import type { ProblemRepository } from '../../domain/repositories/problem.repository';
import { ListProblemsByRoomUseCase } from './list-problems-by-room.use-case';

describe('ListProblemsByRoomUseCase', () => {
  let useCase: ListProblemsByRoomUseCase;
  let findByRoomIdMock: jest.Mock;
  let assertTutorCanAccessRoomMock: jest.Mock;

  beforeEach(() => {
    findByRoomIdMock = jest.fn();
    assertTutorCanAccessRoomMock = jest.fn();

    const problemRepository: jest.Mocked<ProblemRepository> = {
      create: jest.fn(),
      findById: jest.fn(),
      findByRoomId: findByRoomIdMock,
    };

    const roomAccessService = {
      assertTutorCanAccessRoom: assertTutorCanAccessRoomMock,
      assertTutorIsRoomOwner: jest.fn(),
      assertResourceBelongsToRoom: jest.fn(),
    } as unknown as jest.Mocked<RoomAccessService>;

    useCase = new ListProblemsByRoomUseCase(problemRepository, roomAccessService);
  });

  it('rejects when room is not found', async () => {
    assertTutorCanAccessRoomMock.mockRejectedValueOnce(new NotFoundError('Sala não encontrada.'));

    await expect(
      useCase.execute({ roomId: 'non-existent-room', tutorId: 'tutor-1' }),
    ).rejects.toThrow(NotFoundError);

    expect(findByRoomIdMock).not.toHaveBeenCalled();
  });

  it('rejects when tutor does not have access to the room', async () => {
    assertTutorCanAccessRoomMock.mockRejectedValueOnce(
      new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
    );

    await expect(
      useCase.execute({ roomId: 'room-1', tutorId: 'unauthorized-tutor' }),
    ).rejects.toThrow(ForbiddenError);

    expect(findByRoomIdMock).not.toHaveBeenCalled();
  });

  it('returns an empty array when the room has no problems', async () => {
    assertTutorCanAccessRoomMock.mockResolvedValueOnce(new Room());
    findByRoomIdMock.mockResolvedValueOnce([]);

    const result = await useCase.execute({ roomId: 'empty-room', tutorId: 'tutor-1' });

    expect(result).toEqual([]);
    expect(assertTutorCanAccessRoomMock).toHaveBeenCalledWith('empty-room', 'tutor-1');
    expect(findByRoomIdMock).toHaveBeenCalledWith('empty-room');
  });

  it('returns the list of problems for the given room in order', async () => {
    assertTutorCanAccessRoomMock.mockResolvedValueOnce(new Room());

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

    const result = await useCase.execute({ roomId: 'room-1', tutorId: 'tutor-1' });

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Problema 1');
    expect(result[1].title).toBe('Problema 2');
    expect(result[0].orderIndex).toBe(1);
    expect(result[1].orderIndex).toBe(2);
  });
});
