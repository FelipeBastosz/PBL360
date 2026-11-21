import { FeedbackTemplate } from '../../domain/entities/feedback-template.entity';
import type { ListFeedbackTemplatesUseCase } from '../../application/use-cases/list-feedback-templates.use-case';
import { FeedbackTemplatesController } from './feedback-templates.controller';

describe('FeedbackTemplatesController', () => {
  let controller: FeedbackTemplatesController;
  let listUseCase: jest.Mocked<ListFeedbackTemplatesUseCase>;

  beforeEach(() => {
    listUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListFeedbackTemplatesUseCase>;

    controller = new FeedbackTemplatesController(listUseCase);
  });

  it('returns the catalog mapped to the Portuguese response contract', async () => {
    const template = FeedbackTemplate.create({
      title: 'Boa participação e engajamento',
      text: 'Demonstrou participação ativa durante a sessão tutorial.',
    });
    template.id = '4f700000-0000-4000-8000-000000000001';
    listUseCase.execute.mockResolvedValue([template]);

    const result = await controller.list();

    expect(result).toEqual([
      {
        id: '4f700000-0000-4000-8000-000000000001',
        titulo: 'Boa participação e engajamento',
        texto: 'Demonstrou participação ativa durante a sessão tutorial.',
      },
    ]);
    expect(listUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
