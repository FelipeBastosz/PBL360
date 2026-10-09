import { Test, type TestingModule } from '@nestjs/testing';

import {
  ConflictError,
  ForbiddenError,
  InvalidRequestError,
} from '@/shared/errors/application.error';

import { Session } from '../../domain/entities/session.entity';
import { InvalidSessionError } from '../../domain/errors/invalid-session.error';
import { SESSION_REPOSITORY } from '../../domain/repositories/session.repository';
import { SessionAccessService } from '../services/session-access.service';
import { UpdateEvaluationReleasesUseCase } from './update-evaluation-releases.use-case';

const base = { sessionId: 'session-1', tutorId: 'tutor-1' };
const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
const past = new Date(Date.now() - 24 * 60 * 60 * 1000);

const storedSession = () =>
  Object.assign(new Session(), {
    id: 'session-1',
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
    save: jest.Mock<Promise<Session>, [Session]>;
    countReleaseSubmissions: jest.Mock;
  };
  let assertTutorCanAccessSessionById: jest.Mock;

  beforeEach(async () => {
    repository = {
      save: jest.fn<Promise<Session>, [Session]>((session) => Promise.resolve(session)),
      countReleaseSubmissions: jest.fn().mockResolvedValue({
        rollCallSaved: true,
        presentStudents: 3,
        selfSubmitted: 1,
        peerSubmitted: 2,
      }),
    };
    assertTutorCanAccessSessionById = jest
      .fn()
      .mockResolvedValue({ session: storedSession(), roomId: 'room-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateEvaluationReleasesUseCase,
        { provide: SESSION_REPOSITORY, useValue: repository },
        { provide: SessionAccessService, useValue: { assertTutorCanAccessSessionById } },
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
    assertTutorCanAccessSessionById.mockResolvedValue({
      session: Object.assign(storedSession(), { peerEvalReleased: true, peerEvalDeadline: future }),
      roomId: 'room-1',
    });

    const result = await useCase.execute({ ...base, self: { released: true, deadline: null } });

    expect(result.self.released).toBe(true);
    expect(result.peer).toMatchObject({ released: true, deadline: future });
  });

  it('rejects a body without any release', async () => {
    await expect(useCase.execute(base)).rejects.toThrow(InvalidRequestError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects a session whose roll call was not saved', async () => {
    repository.countReleaseSubmissions.mockResolvedValue({
      rollCallSaved: false,
      presentStudents: 0,
      selfSubmitted: 0,
      peerSubmitted: 0,
    });

    await expect(
      useCase.execute({ ...base, self: { released: true, deadline: null } }),
    ).rejects.toThrow(ConflictError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects a deadline in the past without saving anything', async () => {
    await expect(
      useCase.execute({
        ...base,
        self: { released: true, deadline: future },
        peer: { released: true, deadline: past },
      }),
    ).rejects.toThrow(InvalidSessionError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects a tutor outside the room', async () => {
    assertTutorCanAccessSessionById.mockRejectedValue(new ForbiddenError('Acesso negado.'));

    await expect(
      useCase.execute({ ...base, self: { released: true, deadline: null } }),
    ).rejects.toThrow(ForbiddenError);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
