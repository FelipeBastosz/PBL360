import type { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { Feedback } from '../../domain/entities/feedback.entity';
import { GetOwnSessionFeedbackUseCase } from './get-own-session-feedback.use-case';

describe('GetOwnSessionFeedbackUseCase', () => {
  const sessionAccess = { assertMemberCanAccessSession: jest.fn() };
  const feedbacks = {
    findStudentSessionFeedback: jest.fn(),
    markStudentSessionFeedbackRead: jest.fn(),
  };
  let useCase: GetOwnSessionFeedbackUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({});
    useCase = new GetOwnSessionFeedbackUseCase(
      sessionAccess as unknown as SessionAccessService,
      feedbacks as never,
    );
  });

  it('returns and marks the student feedback as read', async () => {
    const feedback = Object.assign(new Feedback(), { id: 'feedback-1' });
    const now = new Date('2026-10-10T12:00:00.000Z');
    feedbacks.findStudentSessionFeedback.mockResolvedValue(feedback);

    await expect(useCase.execute('session-1', 'student-1', now)).resolves.toBe(feedback);
    expect(sessionAccess.assertMemberCanAccessSession).toHaveBeenCalledWith('session-1', {
      id: 'student-1',
      type: 'STUDENT',
    });
    expect(feedbacks.markStudentSessionFeedbackRead).toHaveBeenCalledWith(
      'feedback-1',
      'student-1',
      now,
    );
  });

  it('does not create read tracking when feedback does not exist', async () => {
    feedbacks.findStudentSessionFeedback.mockResolvedValue(null);

    await expect(useCase.execute('session-1', 'student-1')).resolves.toBeNull();
    expect(feedbacks.markStudentSessionFeedbackRead).not.toHaveBeenCalled();
  });
});
