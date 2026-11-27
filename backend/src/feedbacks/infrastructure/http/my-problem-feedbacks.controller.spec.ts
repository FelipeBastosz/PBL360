import { MyProblemFeedbacksController } from './my-problem-feedbacks.controller';

describe('MyProblemFeedbacksController', () => {
  it('returns the authenticated student problem feedbacks', async () => {
    const result = { finalScore: 8, individual: null, general: null, sessions: [] };
    const getFeedbacks = { execute: jest.fn().mockResolvedValue(result) };
    const controller = new MyProblemFeedbacksController(getFeedbacks as never);
    await expect(controller.get('r1', 'p1', 's1')).resolves.toEqual({
      notaFinal: 8,
      feedbacks: [],
      individual: null,
      geral: null,
      sessoes: [],
    });
    expect(getFeedbacks.execute).toHaveBeenCalledWith('r1', 'p1', 's1');
  });
});
