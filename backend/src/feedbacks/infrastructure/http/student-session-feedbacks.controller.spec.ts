import type { GetOwnSessionFeedbackUseCase } from '../../application/use-cases/get-own-session-feedback.use-case';
import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';
import { StudentSessionFeedbacksController } from './student-session-feedbacks.controller';

describe('StudentSessionFeedbacksController', () => {
  const getFeedback = { execute: jest.fn() };
  let controller: StudentSessionFeedbacksController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new StudentSessionFeedbacksController(
      getFeedback as unknown as GetOwnSessionFeedbackUseCase,
    );
  });

  it('returns the student feedback in the API contract', async () => {
    const feedback = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      sessionId: 'session-1',
      recipientId: 'student-1',
      scope: FeedbackScope.SESSION,
      text: 'Boa participação.',
    });
    feedback.id = 'feedback-1';
    getFeedback.execute.mockResolvedValue(feedback);

    await expect(controller.get('session-1', 'student-1')).resolves.toMatchObject({
      id: 'feedback-1',
      texto: 'Boa participação.',
    });
    expect(getFeedback.execute).toHaveBeenCalledWith('session-1', 'student-1');
  });

  it('returns null when no feedback has been registered', async () => {
    getFeedback.execute.mockResolvedValue(null);

    await expect(controller.get('session-1', 'student-1')).resolves.toBeNull();
  });
});
