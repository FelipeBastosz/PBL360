import { Test, type TestingModule } from '@nestjs/testing';

import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  ForbiddenError,
  InvalidRequestError,
  NotFoundError,
} from '@/shared/errors/application.error';

import { Problem } from '../../domain/entities/problem.entity';
import { InvalidProblemError } from '../../domain/errors/invalid-problem.error';
import { PROBLEM_REPOSITORY } from '../../domain/repositories/problem.repository';
import { UpdateEvaluationReleasesUseCase } from './update-evaluation-releases.use-case';

const base = { roomId: 'room-1', problemId: 'prob-1', tutorId: 'tutor-1' };
const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
const past = new Date(Date.now() - 24 * 60 * 60 * 1000);

const storedProblem = () =>
  Object.assign(new Problem(), {
    id: 'prob-1',
    roomId: 'room-1',
    selfEvalReleased: false,
    selfEvalDeadline: null,
    peerEvalReleased: false,
    peerEvalDeadline: null,
    releasedAt: null,
    releasedBy: null,
  });

describe('UpdateEvaluationReleasesUseCase', () => {
  let useCase: UpdateEvaluationReleasesUseCase;
  let repository: {
    findById: jest.Mock;
    save: jest.Mock<Promise<Problem>, [Problem]>;
    countReleaseSubmissions: jest.Mock;
  };
  let assertTutorCanAccessRoom: jest.Mock;

  beforeEach(async () => {
    repository = {
      findById: jest.fn().mockResolvedValue(storedProblem()),
      save: jest.fn<Promise<Problem>, [Problem]>((problem) => Promise.resolve(problem)),
      countReleaseSubmissions: jest
        .fn()
        .mockResolvedValue({ students: 3, selfSubmitted: 1, peerSubmitted: 2 }),
    };
    assertTutorCanAccessRoom = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateEvaluationReleasesUseCase,
        { provide: PROBLEM_REPOSITORY, useValue: repository },
        { provide: RoomAccessService, useValue: { assertTutorCanAccessRoom } },
      ],
    }).compile();

    useCase = module.get(UpdateEvaluationReleasesUseCase);
  });

  it('releases both evaluations and records the author', async () => {
    const result = await useCase.execute({
      ...base,
      self: { released: true, deadline: future },
      peer: { released: true, deadline: null },
    });

    const [saved] = repository.save.mock.calls[0] ?? [];
    expect(saved?.selfEvalReleased).toBe(true);
    expect(saved?.peerEvalReleased).toBe(true);
    expect(saved?.releasedBy).toBe('tutor-1');
    expect(result.self).toEqual({ released: true, deadline: future, submitted: 1, expected: 3 });
    expect(result.peer).toEqual({ released: true, deadline: null, submitted: 2, expected: 6 });
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.updatedBy).toBe('tutor-1');
  });

  it('changes only the informed release', async () => {
    repository.findById.mockResolvedValue(
      Object.assign(storedProblem(), { peerEvalReleased: true, peerEvalDeadline: future }),
    );

    const result = await useCase.execute({ ...base, self: { released: true, deadline: null } });

    expect(result.self.released).toBe(true);
    expect(result.peer).toMatchObject({ released: true, deadline: future });
  });

  it('rejects a body without any release', async () => {
    await expect(useCase.execute(base)).rejects.toThrow(InvalidRequestError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects a deadline in the past without saving anything', async () => {
    await expect(
      useCase.execute({
        ...base,
        self: { released: true, deadline: future },
        peer: { released: true, deadline: past },
      }),
    ).rejects.toThrow(InvalidProblemError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects a tutor outside the room', async () => {
    assertTutorCanAccessRoom.mockRejectedValue(new ForbiddenError('Acesso negado.'));

    await expect(
      useCase.execute({ ...base, self: { released: true, deadline: null } }),
    ).rejects.toThrow(ForbiddenError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects a problem that does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ ...base, self: { released: true, deadline: null } }),
    ).rejects.toThrow(NotFoundError);
  });
});
