import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';

import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { Room } from '@/rooms/domain/entities/room.entity';

import { Problem } from '../../domain/entities/problem.entity';
import type { ProblemRepository } from '../../domain/repositories/problem.repository';
import { GetProblemUseCase } from './get-problem.use-case';

describe('GetProblemUseCase', () => {
  let useCase: GetProblemUseCase;
  let findByIdMock: jest.Mock;
  let assertTutorCanAccessRoomMock: jest.Mock;

  beforeEach(() => {
    findByIdMock = jest.fn();
    assertTutorCanAccessRoomMock = jest.fn();

    const problemRepository: jest.Mocked<ProblemRepository> = {
      hasEvaluations: jest.fn(),
      updateDetails: jest.fn(),
      hasSessions: jest.fn(),
      countSessions: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findById: findByIdMock,
      findByRoomId: jest.fn(),
    };

    const roomAccessService = {
      assertTutorCanAccessRoom: assertTutorCanAccessRoomMock,
      assertTutorIsRoomOwner: jest.fn(),
      assertResourceBelongsToRoom: jest.fn(),
    } as unknown as jest.Mocked<RoomAccessService>;

    useCase = new GetProblemUseCase(problemRepository, roomAccessService);
  });

  it('rejects when room is not found', async () => {
    assertTutorCanAccessRoomMock.mockRejectedValueOnce(new NotFoundError('Sala não encontrada.'));

    await expect(
      useCase.execute({
        roomId: 'non-existent-room',
        problemId: 'prob-1',
        tutorId: 'tutor-1',
      }),
    ).rejects.toThrow(NotFoundError);

    expect(findByIdMock).not.toHaveBeenCalled();
  });

  it('rejects when tutor does not have access to the room', async () => {
    assertTutorCanAccessRoomMock.mockRejectedValueOnce(
      new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
    );

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'prob-1',
        tutorId: 'unauthorized-tutor',
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(findByIdMock).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when problem does not exist', async () => {
    assertTutorCanAccessRoomMock.mockResolvedValueOnce(new Room());
    findByIdMock.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'prob-not-found',
        tutorId: 'tutor-1',
      }),
    ).rejects.toThrow(new NotFoundError('Problema não encontrado.'));
  });

  it('throws NotFoundError when problem belongs to a different room', async () => {
    assertTutorCanAccessRoomMock.mockResolvedValueOnce(new Room());

    const problemOfAnotherRoom = Problem.create({
      roomId: 'other-room-id',
      title: 'Problema de Outra Sala',
      orderIndex: 1,
      createdBy: 'tutor-1',
    });
    problemOfAnotherRoom.id = 'prob-1';

    findByIdMock.mockResolvedValueOnce(problemOfAnotherRoom);

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'prob-1',
        tutorId: 'tutor-1',
      }),
    ).rejects.toThrow(new NotFoundError('Problema não encontrado.'));
  });

  it('returns problem when it exists and belongs to the room', async () => {
    assertTutorCanAccessRoomMock.mockResolvedValueOnce(new Room());

    const expectedProblem = Problem.create({
      roomId: 'room-1',
      title: 'Problema da Sala',
      orderIndex: 1,
      createdBy: 'tutor-1',
    });
    expectedProblem.id = 'prob-1';

    findByIdMock.mockResolvedValueOnce(expectedProblem);

    const result = await useCase.execute({
      roomId: 'room-1',
      problemId: 'prob-1',
      tutorId: 'tutor-1',
    });

    expect(result).toBe(expectedProblem);
    expect(result.id).toBe('prob-1');
    expect(result.roomId).toBe('room-1');
  });
});
