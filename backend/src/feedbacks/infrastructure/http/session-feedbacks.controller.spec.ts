import type { Response } from 'express';
import { SessionFeedbacksController } from './session-feedbacks.controller';
import type { SaveSessionFeedbackUseCase } from '../../application/use-cases/save-session-feedback.use-case';
import type { GetSessionFeedbackUseCase } from '../../application/use-cases/get-session-feedback.use-case';
import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';

describe('SessionFeedbacksController', () => {
  let controller: SessionFeedbacksController;
  let saveUseCase: jest.Mocked<SaveSessionFeedbackUseCase>;
  let getUseCase: jest.Mocked<GetSessionFeedbackUseCase>;

  const createResponse = () => {
    const json = jest.fn();
    const response = { status: jest.fn().mockReturnValue({ json }) } as unknown as Response;
    return { response, json };
  };

  beforeEach(() => {
    saveUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<SaveSessionFeedbackUseCase>;

    getUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetSessionFeedbackUseCase>;

    controller = new SessionFeedbacksController(saveUseCase, getUseCase);
  });

  it('handles save feedback on session', async () => {
    const feedback = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      sessionId: 'session-1',
      recipientId: 'student-1',
      scope: FeedbackScope.SESSION,
      text: 'Muito prestativo.',
    });
    feedback.id = 'fb-session';
    saveUseCase.execute.mockResolvedValue(feedback);
    const { response, json } = createResponse();

    await controller.save(
      'session-1',
      'student-1',
      { texto: 'Muito prestativo.' },
      'tutor-1',
      response,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'fb-session',
        escopo: 'SESSAO',
        texto: 'Muito prestativo.',
      }),
    );
    expect(saveUseCase.execute).toHaveBeenCalledWith({
      sessionId: 'session-1',
      studentId: 'student-1',
      tutorId: 'tutor-1',
      text: 'Muito prestativo.',
    });
  });

  it('sends JSON null when saving empty feedback clears existing session feedback', async () => {
    saveUseCase.execute.mockResolvedValue(null);
    const { response, json } = createResponse();

    await controller.save('session-1', 'student-1', { texto: '' }, 'tutor-1', response);

    expect(json).toHaveBeenCalledWith(null);
  });

  it('handles get feedback on session when present', async () => {
    const feedback = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      sessionId: 'session-1',
      recipientId: 'student-1',
      scope: FeedbackScope.SESSION,
      text: 'Muito prestativo.',
    });
    feedback.id = 'fb-session';
    getUseCase.execute.mockResolvedValue(feedback);
    const { response, json } = createResponse();

    await controller.get('session-1', 'student-1', 'tutor-1', response);

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ id: 'fb-session' }));
    expect(getUseCase.execute).toHaveBeenCalledWith({
      sessionId: 'session-1',
      studentId: 'student-1',
      tutorId: 'tutor-1',
    });
  });

  it('handles get feedback on session when absent', async () => {
    getUseCase.execute.mockResolvedValue(null);
    const { response, json } = createResponse();

    await controller.get('session-1', 'student-1', 'tutor-1', response);

    expect(json).toHaveBeenCalledWith(null);
  });
});
