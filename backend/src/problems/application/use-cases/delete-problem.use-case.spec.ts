import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';

import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { Room } from '@/rooms/domain/entities/room.entity';

import { Problem } from '../../domain/entities/problem.entity';
import type { ProblemRepository } from '../../domain/repositories/problem.repository';
import { DeleteProblemUseCase } from './delete-problem.use-case';

describe('DeleteProblemUseCase', () => {
  let useCase: DeleteProblemUseCase;
  let findByIdMock: jest.Mock;
  let getDeletionImpactMock: jest.Mock;
  let deleteMock: jest.Mock;
  let assertTutorIsRoomOwnerMock: jest.Mock;

  beforeEach(() => {
    findByIdMock = jest.fn();
    getDeletionImpactMock = jest.fn().mockResolvedValue({
      sessions: 0,
      grades: 0,
      feedbacks: 0,
      evaluations: 0,
    });
    deleteMock = jest.fn();
    assertTutorIsRoomOwnerMock = jest.fn();

    const problemRepository = {
      create: jest.fn(),
      findById: findByIdMock,
      findByRoomId: jest.fn(),
      hasSessions: jest.fn(),
      getDeletionImpact: getDeletionImpactMock,
      countSessions: jest.fn().mockResolvedValue(0),
      delete: deleteMock,
    } as unknown as jest.Mocked<ProblemRepository>;

    const roomAccessService = {
      assertTutorCanAccessRoom: jest.fn(),
      assertTutorIsRoomOwner: assertTutorIsRoomOwnerMock,
      assertResourceBelongsToRoom: jest.fn(),
    } as unknown as jest.Mocked<RoomAccessService>;

    useCase = new DeleteProblemUseCase(problemRepository, roomAccessService);
  });

  it('rejects when room is not found', async () => {
    assertTutorIsRoomOwnerMock.mockRejectedValueOnce(new NotFoundError('Sala não encontrada.'));

    await expect(
      useCase.execute({
        roomId: 'non-existent-room',
        problemId: 'prob-1',
        tutorId: 'tutor-1',
      }),
    ).rejects.toThrow(NotFoundError);

    expect(findByIdMock).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('rejects when tutor is not the room owner (US08: apenas responsável pode excluir)', async () => {
    assertTutorIsRoomOwnerMock.mockRejectedValueOnce(
      new ForbiddenError('Apenas o professor responsável pode realizar esta ação.'),
    );

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'prob-1',
        tutorId: 'associated-tutor',
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(findByIdMock).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('rejects when problem is not found', async () => {
    assertTutorIsRoomOwnerMock.mockResolvedValueOnce(new Room());
    findByIdMock.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'non-existent-problem',
        tutorId: 'tutor-owner',
      }),
    ).rejects.toThrow(new NotFoundError('Problema não encontrado.'));

    expect(findByIdMock).toHaveBeenCalledWith('non-existent-problem');
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('rejects when problem belongs to another room', async () => {
    assertTutorIsRoomOwnerMock.mockResolvedValueOnce(new Room());

    const problem = Problem.create({
      roomId: 'other-room-id',
      createdBy: 'tutor-owner',
      title: 'Problema da outra sala',
    });
    problem.id = 'prob-1';
    findByIdMock.mockResolvedValueOnce(problem);

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: problem.id,
        tutorId: 'tutor-owner',
      }),
    ).rejects.toThrow(new NotFoundError('Problema não encontrado.'));

    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('deletes problem successfully when tutor is owner and problem belongs to room', async () => {
    assertTutorIsRoomOwnerMock.mockResolvedValueOnce(new Room());

    const problem = Problem.create({
      roomId: 'room-1',
      createdBy: 'tutor-owner',
      title: 'Problema a ser excluído',
    });
    problem.id = 'prob-1';
    findByIdMock.mockResolvedValueOnce(problem);
    deleteMock.mockResolvedValueOnce(undefined);

    await useCase.execute({
      roomId: 'room-1',
      problemId: problem.id,
      tutorId: 'tutor-owner',
    });

    expect(assertTutorIsRoomOwnerMock).toHaveBeenCalledWith('room-1', 'tutor-owner');
    expect(findByIdMock).toHaveBeenCalledWith(problem.id);
    expect(deleteMock).toHaveBeenCalledWith(problem.id, 'room-1');
  });

  it('rejects deletion when the problem has sessions', async () => {
    assertTutorIsRoomOwnerMock.mockResolvedValueOnce(new Room());
    const problem = Problem.create({
      roomId: 'room-1',
      createdBy: 'tutor-owner',
      title: 'Problem',
    });
    problem.id = 'prob-1';
    findByIdMock.mockResolvedValueOnce(problem);
    getDeletionImpactMock.mockResolvedValueOnce({
      sessions: 1,
      grades: 0,
      feedbacks: 0,
      evaluations: 0,
    });

    await expect(
      useCase.execute({ roomId: 'room-1', problemId: problem.id, tutorId: 'tutor-owner' }),
    ).rejects.toMatchObject({
      name: 'ConflictError',
      details: { detalhes: { sessoes: 1, notas: 0, feedbacks: 0, avaliacoes: 0 } },
    });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('blocks a problem with feedbacks even when it has no sessions', async () => {
    findByIdMock.mockResolvedValueOnce({ id: 'prob-1', roomId: 'room-1' });
    getDeletionImpactMock.mockResolvedValueOnce({
      sessions: 0,
      grades: 0,
      feedbacks: 3,
      evaluations: 0,
    });

    await expect(
      useCase.execute({ roomId: 'room-1', problemId: 'prob-1', tutorId: 'tutor-owner' }),
    ).rejects.toMatchObject({
      name: 'ConflictError',
      message: 'O problema não pode ser excluído pois possui registros vinculados.',
      details: { detalhes: { sessoes: 0, notas: 0, feedbacks: 3, avaliacoes: 0 } },
    });
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
