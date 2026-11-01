import type { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { GetStudentEvaluationSummaryUseCase } from './get-student-evaluation-summary.use-case';

describe('GetStudentEvaluationSummaryUseCase', () => {
  const sessionAccess = { assertMemberCanAccessSession: jest.fn() };
  const evaluations = {
    getStudentEvaluationSummary: jest.fn(),
    getSelfAssessment: jest.fn(),
  };
  const feedbacks = {
    findStudentSessionFeedback: jest.fn(),
    findStudentSessionFeedbackReadAt: jest.fn(),
  };
  let useCase: GetStudentEvaluationSummaryUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: {
        selfEvalReleased: false,
        selfEvalDeadline: null,
        peerEvalReleased: false,
        peerEvalDeadline: null,
      },
      problem: { id: 'problem-1' },
      roomId: 'room-1',
    });
    evaluations.getStudentEvaluationSummary.mockResolvedValue({
      participating: true,
      tutorEvaluationSubmitted: true,
      peerSubmitted: 1,
      peerTotal: 2,
    });
    evaluations.getSelfAssessment.mockResolvedValue({ config: { criteria: [] }, evaluation: null });
    feedbacks.findStudentSessionFeedback.mockResolvedValue(null);
    useCase = new GetStudentEvaluationSummaryUseCase(
      sessionAccess as unknown as SessionAccessService,
      evaluations as never,
      feedbacks as never,
    );
  });

  it('returns unavailable feedback when none is registered', async () => {
    evaluations.getStudentEvaluationSummary.mockResolvedValue({
      participating: true,
      tutorEvaluationSubmitted: false,
      peerSubmitted: 1,
      peerTotal: 2,
    });
    await expect(useCase.execute('session-1', 'student-1')).resolves.toMatchObject({
      feedback: { available: false, new: false, tutorEvaluationSubmitted: false },
    });
    expect(feedbacks.findStudentSessionFeedbackReadAt).not.toHaveBeenCalled();
  });

  it('reports when the tutor evaluation is submitted before feedback is available', async () => {
    evaluations.getStudentEvaluationSummary.mockResolvedValue({
      participating: true,
      tutorEvaluationSubmitted: true,
      peerSubmitted: 1,
      peerTotal: 2,
    });

    await expect(useCase.execute('session-1', 'student-1')).resolves.toMatchObject({
      feedback: { available: false, tutorEvaluationSubmitted: true },
    });
  });

  it('marks feedback new until the current version has been read', async () => {
    const feedback = {
      id: 'feedback-1',
      createdAt: new Date('2026-10-09T12:00:00.000Z'),
      editedAt: null,
    };
    feedbacks.findStudentSessionFeedback.mockResolvedValue(feedback);
    feedbacks.findStudentSessionFeedbackReadAt.mockResolvedValue(null);

    await expect(useCase.execute('session-1', 'student-1')).resolves.toMatchObject({
      feedback: {
        available: true,
        new: true,
        tutorEvaluationSubmitted: true,
      },
    });

    feedbacks.findStudentSessionFeedbackReadAt.mockResolvedValue(
      new Date('2026-10-10T12:00:00.000Z'),
    );
    await expect(useCase.execute('session-1', 'student-1')).resolves.toMatchObject({
      feedback: {
        available: true,
        new: false,
        tutorEvaluationSubmitted: true,
      },
    });
  });

  it('marks an edited feedback as new after it was read', async () => {
    feedbacks.findStudentSessionFeedback.mockResolvedValue({
      id: 'feedback-1',
      createdAt: new Date('2026-10-09T12:00:00.000Z'),
      editedAt: new Date('2026-10-11T12:00:00.000Z'),
    });
    feedbacks.findStudentSessionFeedbackReadAt.mockResolvedValue(
      new Date('2026-10-10T12:00:00.000Z'),
    );

    await expect(useCase.execute('session-1', 'student-1')).resolves.toMatchObject({
      feedback: {
        available: true,
        new: true,
        tutorEvaluationSubmitted: true,
      },
    });
  });
});
