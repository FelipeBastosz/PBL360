import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';

import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { Room } from '@/rooms/domain/entities/room.entity';

import { Problem } from '../../domain/entities/problem.entity';
import type { ProblemRepository } from '../../domain/repositories/problem.repository';
import { GetProblemDeletionImpactUseCase } from './get-problem-deletion-impact.use-case';

describe('GetProblemDeletionImpactUseCase', () => {
  let useCase: GetProblemDeletionImpactUseCase;
  let findByIdMock: jest.Mock;
  let assertTutorCanAccessRoomMock: jest.Mock;
  let getDeletionImpactMock: jest.Mock;

  beforeEach(() => {
    findByIdMock = jest.fn();
    assertTutorCanAccessRoomMock = jest.fn();
    getDeletionImpactMock = jest.fn().mockResolvedValue({
      sessions: 0,
      grades: 0,
      feedbacks: 0,
      evaluations: 0,
    });

    const problemRepository = {
      create: jest.fn(),
      findById: findByIdMock,
      findByRoomId: jest.fn(),
      hasSessions: jest.fn().mockResolvedValue(false),
      countSessions: jest.fn().mockResolvedValue(0),
      getDeletionImpact: getDeletionImpactMock,
      delete: jest.fn(),
    } as unknown as jest.Mocked<ProblemRepository>;

    const roomAccessService = {
      assertTutorCanAccessRoom: assertTutorCanAccessRoomMock,
      assertTutorIsRoomOwner: jest.fn(),
      assertResourceBelongsToRoom: jest.fn(),
    } as unknown as jest.Mocked<RoomAccessService>;

    useCase = new GetProblemDeletionImpactUseCase(problemRepository, roomAccessService);
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

  it('rejects when problem is not found in repository', async () => {
    assertTutorCanAccessRoomMock.mockResolvedValueOnce(new Room());
    findByIdMock.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'non-existent-problem',
        tutorId: 'tutor-1',
      }),
    ).rejects.toThrow(new NotFoundError('Problema não encontrado.'));

    expect(findByIdMock).toHaveBeenCalledWith('non-existent-problem');
  });

  it('rejects when problem belongs to another room', async () => {
    assertTutorCanAccessRoomMock.mockResolvedValueOnce(new Room());

    const problem = Problem.create({
      roomId: 'other-room-id',
      createdBy: 'tutor-1',
      title: 'Problema de outra sala',
    });
    problem.id = 'prob-1';
    findByIdMock.mockResolvedValueOnce(problem);

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: problem.id,
        tutorId: 'tutor-1',
      }),
    ).rejects.toThrow(new NotFoundError('Problema não encontrado.'));
  });

  it('returns zero for all dependent records in the definitive format', async () => {
    assertTutorCanAccessRoomMock.mockResolvedValueOnce(new Room());

    const problem = Problem.create({
      roomId: 'room-1',
      createdBy: 'tutor-1',
      title: 'Problema válido',
    });
    problem.id = 'prob-1';
    findByIdMock.mockResolvedValueOnce(problem);

    const impact = await useCase.execute({
      roomId: 'room-1',
      problemId: problem.id,
      tutorId: 'tutor-1',
    });

    expect(impact).toEqual({
      sessions: 0,
      grades: 0,
      feedbacks: 0,
      evaluations: 0,
    });
    expect(assertTutorCanAccessRoomMock).toHaveBeenCalledWith('room-1', 'tutor-1');
    expect(findByIdMock).toHaveBeenCalledWith(problem.id);
    expect(getDeletionImpactMock).toHaveBeenCalledWith(problem.id);
  });

  it('returns real counts for all dependent records when dependencies exist', async () => {
    assertTutorCanAccessRoomMock.mockResolvedValueOnce(new Room());

    const problem = Problem.create({
      roomId: 'room-1',
      createdBy: 'tutor-1',
      title: 'Problema com dependências',
    });
    problem.id = 'prob-2';
    findByIdMock.mockResolvedValueOnce(problem);

    getDeletionImpactMock.mockResolvedValueOnce({
      sessions: 3,
      grades: 12,
      feedbacks: 6,
      evaluations: 24,
    });

    const impact = await useCase.execute({
      roomId: 'room-1',
      problemId: problem.id,
      tutorId: 'tutor-1',
    });

    expect(impact).toEqual({
      sessions: 3,
      grades: 12,
      feedbacks: 6,
      evaluations: 24,
    });
    expect(getDeletionImpactMock).toHaveBeenCalledWith(problem.id);
  });
});
