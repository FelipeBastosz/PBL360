import { Test, type TestingModule } from '@nestjs/testing';

import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';

import { Session } from '../../domain/entities/session.entity';
import { SESSION_REPOSITORY } from '../../domain/repositories/session.repository';
import { SessionAccessService } from '../services/session-access.service';
import { GetEvaluationReleasesUseCase } from './get-evaluation-releases.use-case';

const input = { sessionId: 'session-1', tutorId: 'tutor-1' };
const deadline = new Date('2026-12-01T12:00:00Z');
const releasedAt = new Date('2026-10-01T12:00:00Z');

const releasedSession = () =>
  Object.assign(new Session(), {
    id: 'session-1',
    selfEvalReleased: true,
    selfEvalDeadline: deadline,
    peerEvalReleased: false,
    peerEvalDeadline: null,
    releasedAt,
    releasedBy: 'tutor-1',
  });

describe('GetEvaluationReleasesUseCase', () => {
  let useCase: GetEvaluationReleasesUseCase;
  let repository: { countReleaseSubmissions: jest.Mock };
  let assertTutorCanAccessSessionById: jest.Mock;

  beforeEach(async () => {
    repository = {
      countReleaseSubmissions: jest.fn().mockResolvedValue({
        rollCallSaved: true,
        presentStudents: 4,
        selfSubmitted: 3,
        peerSubmitted: 5,
      }),
    };
    assertTutorCanAccessSessionById = jest
      .fn()
      .mockResolvedValue({ session: releasedSession(), roomId: 'room-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEvaluationReleasesUseCase,
        { provide: SESSION_REPOSITORY, useValue: repository },
        { provide: SessionAccessService, useValue: { assertTutorCanAccessSessionById } },
      ],
    }).compile();

    useCase = module.get(GetEvaluationReleasesUseCase);
  });

  it('returns both releases with the adherence of present students', async () => {
    const result = await useCase.execute(input);

    expect(assertTutorCanAccessSessionById).toHaveBeenCalledWith('session-1', 'tutor-1');
    expect(repository.countReleaseSubmissions).toHaveBeenCalledWith('session-1');
    expect(result).toEqual({
      self: { released: true, deadline, submitted: 3, expected: 4 },
      peer: { released: false, deadline: null, submitted: 5, expected: 12 },
      updatedAt: releasedAt,
      updatedBy: 'tutor-1',
    });
  });

  it('expects nothing while the roll call has no present students', async () => {
    repository.countReleaseSubmissions.mockResolvedValue({
      rollCallSaved: false,
      presentStudents: 0,
      selfSubmitted: 0,
      peerSubmitted: 0,
    });

    const result = await useCase.execute(input);

    expect(result.self.expected).toBe(0);
    expect(result.peer.expected).toBe(0);
  });

  it('expects no peer pairs when a single student was present', async () => {
    repository.countReleaseSubmissions.mockResolvedValue({
      rollCallSaved: true,
      presentStudents: 1,
      selfSubmitted: 0,
      peerSubmitted: 0,
    });

    const result = await useCase.execute(input);

    expect(result.peer.expected).toBe(0);
  });

  it('rejects a tutor outside the room', async () => {
    assertTutorCanAccessSessionById.mockRejectedValue(new ForbiddenError('Acesso negado.'));

    await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
    expect(repository.countReleaseSubmissions).not.toHaveBeenCalled();
  });

  it('rejects a session that does not exist', async () => {
    assertTutorCanAccessSessionById.mockRejectedValue(new NotFoundError('Sessão não encontrada.'));

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
});
