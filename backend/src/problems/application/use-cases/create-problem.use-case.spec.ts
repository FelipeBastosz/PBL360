import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';

import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { Problem } from '../../domain/entities/problem.entity';
import { InvalidProblemError } from '../../domain/errors/invalid-problem.error';
import type { ProblemRepository } from '../../domain/repositories/problem.repository';
import { CreateProblemUseCase } from './create-problem.use-case';

describe('CreateProblemUseCase', () => {
  let useCase: CreateProblemUseCase;
  let saveMock: jest.Mock;
  let assertTutorCanAccessRoomMock: jest.Mock;

  const defaultInput = () => ({
    roomId: 'room-uuid-1',
    authorId: 'tutor-uuid-1',
    title: 'Problema 1 - Diagnóstico Clínico',
    description: 'Caso detalhado',
    startDate: '2026-03-01',
    endDate: '2026-03-15',
  });

  beforeEach(() => {
    saveMock = jest.fn();
    assertTutorCanAccessRoomMock = jest.fn();

    const problemRepository: jest.Mocked<ProblemRepository> = {
      updateDetails: jest.fn(),
      hasSessions: jest.fn(),
      countSessions: jest.fn(),
      getDeletionImpact: jest.fn(),
      delete: jest.fn(),
      create: saveMock,
      findById: jest.fn(),
      findByRoomId: jest.fn(),
    };

    const roomAccessService = {
      assertTutorCanAccessRoom: assertTutorCanAccessRoomMock,
      assertTutorIsRoomOwner: jest.fn(),
      assertResourceBelongsToRoom: jest.fn(),
    } as unknown as jest.Mocked<RoomAccessService>;

    useCase = new CreateProblemUseCase(problemRepository, roomAccessService);
  });

  it('creates and saves a problem successfully when tutor has access to room', async () => {
    const input = defaultInput();
    const fakeRoom = { id: input.roomId, tutorId: input.authorId };
    assertTutorCanAccessRoomMock.mockResolvedValueOnce(fakeRoom);

    const savedProblem = Problem.create({
      roomId: input.roomId,
      title: input.title,
      description: input.description,
      orderIndex: 1,
      createdBy: input.authorId,
    });
    savedProblem.id = 'prob-uuid-1';
    saveMock.mockResolvedValueOnce(savedProblem);

    const result = await useCase.execute(input);

    expect(assertTutorCanAccessRoomMock).toHaveBeenCalledWith(input.roomId, input.authorId);
    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: input.roomId,
        title: input.title,
        description: input.description,
        createdBy: input.authorId,
      }),
    );
    expect(result.id).toBe('prob-uuid-1');
  });

  it('fails when room does not exist (NotFoundError)', async () => {
    const input = defaultInput();
    assertTutorCanAccessRoomMock.mockRejectedValueOnce(new NotFoundError('Sala não encontrada.'));

    await expect(useCase.execute(input)).rejects.toThrow(new NotFoundError('Sala não encontrada.'));
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('fails when tutor does not have access to room (ForbiddenError)', async () => {
    const input = defaultInput();
    assertTutorCanAccessRoomMock.mockRejectedValueOnce(
      new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
    );

    await expect(useCase.execute(input)).rejects.toThrow(
      new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
    );
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('fails when problem title is empty (InvalidProblemError)', async () => {
    const input = {
      ...defaultInput(),
      title: '   ',
    };
    assertTutorCanAccessRoomMock.mockResolvedValueOnce({});

    await expect(useCase.execute(input)).rejects.toThrow(
      new InvalidProblemError('O título do problema é obrigatório.'),
    );
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('propagates a persistence failure untouched', async () => {
    const input = defaultInput();
    assertTutorCanAccessRoomMock.mockResolvedValueOnce({});
    saveMock.mockRejectedValueOnce(new Error('DB connection failure'));

    await expect(useCase.execute(input)).rejects.toThrow('DB connection failure');
  });
});
