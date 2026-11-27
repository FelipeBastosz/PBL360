import { MySessionFeedbackController } from './my-session-feedback.controller';

describe('MySessionFeedbackController', () => {
  it('returns null when the student has no session feedback', async () => {
    const getFeedback = { execute: jest.fn().mockResolvedValue(null) };
    const controller = new MySessionFeedbackController(getFeedback as never);
    const response = { json: jest.fn() };
    await expect(controller.get('s1', 'student-1', response as never)).resolves.toBeUndefined();
    expect(getFeedback.execute).toHaveBeenCalledWith('s1', 'student-1');
    expect(response.json).toHaveBeenCalledWith(null);
  });

  it('maps and returns an existing session feedback', async () => {
    const feedback = {
      id: 'f1',
      author: { id: 't1', name: 'Tutor' },
      text: 'Bom trabalho',
      createdAt: new Date('2025-01-01'),
      editedAt: null,
      isNew: true,
      score: 9,
    };
    const getFeedback = { execute: jest.fn().mockResolvedValue(feedback) };
    const controller = new MySessionFeedbackController(getFeedback as never);
    const response = { json: jest.fn() };
    await controller.get('s1', 'student-1', response as never);
    expect(response.json).toHaveBeenCalledWith({
      id: 'f1',
      autor: { id: 't1', nome: 'Tutor' },
      texto: 'Bom trabalho',
      criadoEm: feedback.createdAt,
      editadoEm: null,
      novo: true,
      nota: 9,
    });
  });
});
