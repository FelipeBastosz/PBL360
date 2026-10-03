import { FeedbackRevisionsController } from './feedback-revisions.controller';
import type { GetFeedbackRevisionsUseCase } from '../../application/use-cases/get-feedback-revisions.use-case';

describe('FeedbackRevisionsController', () => {
  let controller: FeedbackRevisionsController;
  let getRevisionsUseCase: jest.Mocked<GetFeedbackRevisionsUseCase>;

  beforeEach(() => {
    getRevisionsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetFeedbackRevisionsUseCase>;

    controller = new FeedbackRevisionsController(getRevisionsUseCase);
  });

  it('lists revisions for a feedback', async () => {
    const date = new Date();
    getRevisionsUseCase.execute.mockResolvedValue([
      {
        score: 8.0,
        text: 'Antigo texto.',
        editedBy: 'Carlos Tutor',
        editedAt: date,
      },
    ]);

    const result = await controller.list('feedback-1', 'tutor-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      nota: 8.0,
      texto: 'Antigo texto.',
      editadoPor: 'Carlos Tutor',
      editadoEm: date,
    });
    expect(getRevisionsUseCase.execute).toHaveBeenCalledWith({
      feedbackId: 'feedback-1',
      tutorId: 'tutor-1',
    });
  });
});
