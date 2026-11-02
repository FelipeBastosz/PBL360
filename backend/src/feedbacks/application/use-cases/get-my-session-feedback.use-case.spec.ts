import type { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { ReceivedFeedbackRepository } from '../../domain/repositories/received-feedback.repository';
import { GetMySessionFeedbackUseCase } from './get-my-session-feedback.use-case';

describe('GetMySessionFeedbackUseCase', () => {
  const access = { assertMemberCanAccessSession: jest.fn() };
  const feedbacks: jest.Mocked<ReceivedFeedbackRepository> = {
    readSession: jest.fn(),
    readProblem: jest.fn(),
  };
  const useCase = new GetMySessionFeedbackUseCase(
    access as unknown as SessionAccessService,
    feedbacks,
  );
  beforeEach(() => jest.resetAllMocks());

  it('reads only the authenticated student feedback after checking membership', async () => {
    const feedback = {
      id: 'feedback',
      author: { id: 'tutor', name: 'Tutor' },
      text: 'Texto',
      createdAt: new Date(),
      editedAt: null,
      isNew: true,
      score: 8.5,
    };
    feedbacks.readSession.mockResolvedValue(feedback);
    expect(await useCase.execute('session', 'student')).toBe(feedback);
    expect(access.assertMemberCanAccessSession).toHaveBeenCalledWith('session', {
      id: 'student',
      type: UserType.STUDENT,
    });
    expect(feedbacks.readSession).toHaveBeenCalledWith('session', 'student');
  });

  it('does not read another room student feedback or record a view on denied access', async () => {
    access.assertMemberCanAccessSession.mockRejectedValue(
      new ForbiddenError('Você não participa desta sala.'),
    );
    await expect(useCase.execute('other-session', 'student')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(feedbacks.readSession).not.toHaveBeenCalled();
  });

  it('propagates a missing session without recording a view', async () => {
    access.assertMemberCanAccessSession.mockRejectedValue(
      new NotFoundError('Sessão não encontrada.'),
    );
    await expect(useCase.execute('missing', 'student')).rejects.toBeInstanceOf(NotFoundError);
    expect(feedbacks.readSession).not.toHaveBeenCalled();
  });

  it('returns null when no feedback is available', async () => {
    feedbacks.readSession.mockResolvedValue(null);
    expect(await useCase.execute('session', 'student')).toBeNull();
  });
});
