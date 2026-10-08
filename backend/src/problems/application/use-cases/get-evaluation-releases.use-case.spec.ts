import { Test, type TestingModule } from '@nestjs/testing';

import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';

import { Problem } from '../../domain/entities/problem.entity';
import { PROBLEM_REPOSITORY } from '../../domain/repositories/problem.repository';
import { GetEvaluationReleasesUseCase } from './get-evaluation-releases.use-case';

const input = { roomId: 'room-1', problemId: 'prob-1', tutorId: 'tutor-1' };
const deadline = new Date('2026-12-01T12:00:00Z');
const releasedAt = new Date('2026-10-01T12:00:00Z');

const releasedProblem = () =>
  Object.assign(new Problem(), {
    id: 'prob-1',
    roomId: 'room-1',
    selfEvalReleased: true,
    selfEvalDeadline: deadline,
    peerEvalReleased: false,
    peerEvalDeadline: null,
    releasedAt,
    releasedBy: 'tutor-1',
  });

describe('GetEvaluationReleasesUseCase', () => {
  let useCase: GetEvaluationReleasesUseCase;
  let repository: { findById: jest.Mock; countReleaseSubmissions: jest.Mock };
  let assertTutorCanAccessRoom: jest.Mock;

  beforeEach(async () => {
    repository = {
      findById: jest.fn().mockResolvedValue(releasedProblem()),
      countReleaseSubmissions: jest
        .fn()
        .mockResolvedValue({ students: 4, selfSubmitted: 3, peerSubmitted: 5 }),
    };
    assertTutorCanAccessRoom = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEvaluationReleasesUseCase,
        { provide: PROBLEM_REPOSITORY, useValue: repository },
        { provide: RoomAccessService, useValue: { assertTutorCanAccessRoom } },
      ],
    }).compile();

    useCase = module.get(GetEvaluationReleasesUseCase);
  });

  it('returns both releases with student adherence', async () => {
    const result = await useCase.execute(input);

    expect(assertTutorCanAccessRoom).toHaveBeenCalledWith('room-1', 'tutor-1');
    expect(repository.countReleaseSubmissions).toHaveBeenCalledWith('prob-1', 'room-1');
    expect(result).toEqual({
      self: { released: true, deadline, submitted: 3, expected: 4 },
      peer: { released: false, deadline: null, submitted: 5, expected: 12 },
      updatedAt: releasedAt,
      updatedBy: 'tutor-1',
    });
  });

  it('expects no peer pairs when the room has a single student', async () => {
    repository.countReleaseSubmissions.mockResolvedValue({
      students: 1,
      selfSubmitted: 0,
      peerSubmitted: 0,
    });

    const result = await useCase.execute(input);

    expect(result.peer.expected).toBe(0);
  });

  it('rejects a tutor outside the room', async () => {
    assertTutorCanAccessRoom.mockRejectedValue(new ForbiddenError('Acesso negado.'));

    await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('rejects a problem from another room', async () => {
    repository.findById.mockResolvedValue(Object.assign(releasedProblem(), { roomId: 'room-2' }));

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
});
