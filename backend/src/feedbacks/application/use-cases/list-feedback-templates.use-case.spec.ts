import { FeedbackTemplate } from '../../domain/entities/feedback-template.entity';
import type { FeedbackTemplateRepository } from '../../domain/repositories/feedback-template.repository';
import { ListFeedbackTemplatesUseCase } from './list-feedback-templates.use-case';

describe('ListFeedbackTemplatesUseCase', () => {
  it('lists every registered feedback template', async () => {
    const templates = [
      Object.assign(new FeedbackTemplate(), {
        id: '4f700000-0000-4000-8000-000000000001',
        title: 'Boa participação e engajamento',
        text: 'Demonstrou participação ativa durante a sessão tutorial.',
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      }),
    ];
    const repository: jest.Mocked<FeedbackTemplateRepository> = { findAll: jest.fn() };
    repository.findAll.mockResolvedValue(templates);

    const useCase = new ListFeedbackTemplatesUseCase(repository);

    await expect(useCase.execute()).resolves.toEqual(templates);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });
});
