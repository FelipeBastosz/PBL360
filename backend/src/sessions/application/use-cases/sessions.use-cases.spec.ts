import { Session } from '../../domain/entities/session.entity';
import type { SessionRepository } from '../../domain/repositories/session.repository';
import type { SessionAccessService } from '../services/session-access.service';
import { CreateSessionUseCase } from './create-session.use-case';
import { DeleteSessionUseCase } from './delete-session.use-case';
import { GetSessionDeletionImpactUseCase } from './get-session-deletion-impact.use-case';
import { GetSessionUseCase } from './get-session.use-case';
import { ListSessionsUseCase } from './list-sessions.use-case';
import { UpdateSessionUseCase } from './update-session.use-case';

describe('Session use cases', () => {
  const session = Session.create({
    problemId: 'problem-1',
    title: 'Session',
    description: null,
    date: '2026-10-15',
  });
  let repository: jest.Mocked<SessionRepository>;
  let access: jest.Mocked<SessionAccessService>;

  beforeEach(() => {
    repository = {
      create: jest.fn().mockResolvedValue(session),
      save: jest.fn().mockResolvedValue(session),
      findById: jest.fn(),
      findByProblemId: jest.fn().mockResolvedValue([session]),
      countReleaseSubmissions: jest.fn(),
      getDeletionImpact: jest.fn().mockResolvedValue({
        chamada: 0,
        papeis: 0,
        observacoes: 0,
        avaliacoes: 0,
        feedbacks: 0,
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    access = {
      assertTutorCanAccessProblem: jest.fn().mockResolvedValue(undefined),
      assertTutorCanAccessSession: jest.fn().mockResolvedValue(session),
    } as unknown as jest.Mocked<SessionAccessService>;
  });

  it('creates a session after validating problem access', async () => {
    const useCase = new CreateSessionUseCase(repository, access);
    await useCase.execute({
      roomId: 'room-1',
      problemId: 'problem-1',
      tutorId: 'tutor-1',
      title: ' Session ',
      description: null,
      date: '2026-10-15',
    });
    expect(access.assertTutorCanAccessProblem).toHaveBeenCalledWith(
      'room-1',
      'problem-1',
      'tutor-1',
    );
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Session' }));
  });

  it('lists sessions only after validating problem access', async () => {
    const useCase = new ListSessionsUseCase(repository, access);
    await expect(
      useCase.execute({ roomId: 'room-1', problemId: 'problem-1', tutorId: 'tutor-1' }),
    ).resolves.toEqual([session]);
    expect(repository.findByProblemId).toHaveBeenCalledWith('problem-1');
  });

  it('returns deletion impact and derives whether the session is empty', async () => {
    repository.getDeletionImpact.mockResolvedValueOnce({
      chamada: 1,
      papeis: 0,
      observacoes: 0,
      avaliacoes: 0,
      feedbacks: 0,
    });
    const useCase = new GetSessionDeletionImpactUseCase(repository, access);
    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'problem-1',
        sessionId: 'session-1',
        tutorId: 'tutor-1',
      }),
    ).resolves.toEqual({
      canDelete: false,
      rollCall: 1,
      roles: 0,
      observations: 0,
      evaluations: 0,
      feedbacks: 0,
    });
  });

  it.each(['chamada', 'papeis', 'observacoes', 'avaliacoes', 'feedbacks'])(
    'blocks deletion and returns structured details when %s records exist',
    async (field) => {
      const impact = {
        chamada: 0,
        papeis: 0,
        observacoes: 0,
        avaliacoes: 0,
        feedbacks: 0,
        [field]: 3,
      };
      repository.getDeletionImpact.mockResolvedValueOnce(impact);
      const useCase = new DeleteSessionUseCase(repository, access);
      await expect(
        useCase.execute({
          roomId: 'room-1',
          problemId: 'problem-1',
          sessionId: 'session-1',
          tutorId: 'tutor-1',
        }),
      ).rejects.toMatchObject({
        name: 'ConflictError',
        message: 'A sessão não pode ser excluída pois possui registros vinculados.',
        details: { detalhes: impact },
      });
      expect(repository.delete).not.toHaveBeenCalled();
    },
  );

  it('reports feedback-only sessions as unavailable for deletion', async () => {
    repository.getDeletionImpact.mockResolvedValueOnce({
      chamada: 0,
      papeis: 0,
      observacoes: 0,
      avaliacoes: 0,
      feedbacks: 2,
    });
    await expect(
      new GetSessionDeletionImpactUseCase(repository, access).execute({
        roomId: 'room-1',
        problemId: 'problem-1',
        sessionId: 'session-1',
        tutorId: 'tutor-1',
      }),
    ).resolves.toEqual({
      canDelete: false,
      rollCall: 0,
      roles: 0,
      observations: 0,
      evaluations: 0,
      feedbacks: 2,
    });
  });

  it('deletes an empty session', async () => {
    const useCase = new DeleteSessionUseCase(repository, access);
    await useCase.execute({
      roomId: 'room-1',
      problemId: 'problem-1',
      sessionId: 'session-1',
      tutorId: 'tutor-1',
    });
    expect(repository.delete).toHaveBeenCalledWith(session.id, 'problem-1');
  });

  it('updates the session after validating its parent path', async () => {
    const useCase = new UpdateSessionUseCase(repository, access);
    await useCase.execute({
      roomId: 'room-1',
      problemId: 'problem-1',
      sessionId: 'session-1',
      tutorId: 'tutor-1',
      title: 'Updated',
      description: 'Details',
      date: '2026-10-16',
    });
    expect(access.assertTutorCanAccessSession).toHaveBeenCalledWith(
      'room-1',
      'problem-1',
      'session-1',
      'tutor-1',
    );
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated' }));
  });

  it('gets a session through the shared access service', async () => {
    const useCase = new GetSessionUseCase(access);
    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'problem-1',
        sessionId: 'session-1',
        tutorId: 'tutor-1',
      }),
    ).resolves.toBe(session);
  });
});
