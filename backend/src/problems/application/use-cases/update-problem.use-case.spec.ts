import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';

import { Test, type TestingModule } from '@nestjs/testing';

import { PROBLEM_REPOSITORY } from '../../domain/repositories/problem.repository';
import type { Problem } from '../../domain/entities/problem.entity';
import type { UpdateProblemDto } from '../dtos/update-problem.dto';
import { UpdateProblemUseCase } from './update-problem.use-case';

const mockProblem = {
  id: 'prob-1',
  roomId: 'room-1',
  title: 'Título antigo',
} as unknown as Problem;

describe('UpdateProblemUseCase', () => {
  let useCase: UpdateProblemUseCase;
  let repository: { findById: jest.Mock; updateDetails: jest.Mock };
  let assertTutorCanAccessRoom: jest.Mock;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      updateDetails: jest.fn(),
    };
    assertTutorCanAccessRoom = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProblemUseCase,
        { provide: PROBLEM_REPOSITORY, useValue: repository },
        {
          provide: RoomAccessService,
          useValue: { assertTutorCanAccessRoom },
        },
      ],
    }).compile();

    useCase = module.get(UpdateProblemUseCase);
  });

  it('should update the title when the problem exists', async () => {
    assertTutorCanAccessRoom.mockResolvedValue(undefined);
    repository.findById.mockResolvedValue({ ...mockProblem });
    repository.updateDetails.mockResolvedValue({ ...mockProblem, title: 'Novo título' });

    const dto: UpdateProblemDto = { title: 'Novo título' };
    const result = await useCase.execute({
      roomId: 'room-1',
      problemId: 'prob-1',
      tutorId: 'tutor-1',
      dto,
    });

    expect(assertTutorCanAccessRoom).toHaveBeenCalledWith('room-1', 'tutor-1');
    expect(repository.findById).toHaveBeenCalledWith('prob-1');
    expect(repository.updateDetails).toHaveBeenCalled();
    expect(result.title).toBe('Novo título');
  });

  it('rejects a tutor who cannot access the room', async () => {
    assertTutorCanAccessRoom.mockRejectedValue(new ForbiddenError('Acesso negado.'));

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'prob-1',
        tutorId: 'tutor-2',
        dto: { title: 'Novo título' },
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.updateDetails).not.toHaveBeenCalled();
  });

  it('rejects a problem that belongs to a different room', async () => {
    assertTutorCanAccessRoom.mockResolvedValue(undefined);
    repository.findById.mockResolvedValue({ ...mockProblem, roomId: 'other-room' });

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'prob-1',
        tutorId: 'tutor-1',
        dto: { title: 'Novo título' },
      }),
    ).rejects.toThrow(new NotFoundError('Problema não encontrado.'));
    expect(repository.updateDetails).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the problem does not exist', async () => {
    assertTutorCanAccessRoom.mockResolvedValue(undefined);
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'invalid-id',
        tutorId: 'tutor-1',
        dto: { title: 'Algo' },
      }),
    ).rejects.toThrow(new NotFoundError('Problema não encontrado.'));
    expect(repository.updateDetails).not.toHaveBeenCalled();
  });
  it('updates only the problem title because table configuration is session-scoped', async () => {
    repository.findById.mockResolvedValue({ ...mockProblem });
    await useCase.execute({
      roomId: 'room-1',
      problemId: 'prob-1',
      tutorId: 'tutor-1',
      dto: { title: '  Título  ' },
    });
    expect(repository.updateDetails).toHaveBeenCalledWith({
      id: 'prob-1',
      roomId: 'room-1',
      authorId: 'tutor-1',
      title: 'Título',
    });
  });
});
