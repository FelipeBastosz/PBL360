import { FeedbackTemplate } from '../../domain/entities/feedback-template.entity';
import { toFeedbackTemplateResponse } from './feedback-template.mapper';

describe('toFeedbackTemplateResponse', () => {
  it('exposes the feedback template with the Portuguese contract fields', () => {
    const template = Object.assign(new FeedbackTemplate(), {
      id: '4f700000-0000-4000-8000-000000000001',
      title: 'Boa participação e engajamento',
      text: 'Demonstrou participação ativa durante a sessão tutorial.',
      createdAt: new Date('2026-10-01T10:00:00.000Z'),
      updatedAt: new Date('2026-10-01T10:00:00.000Z'),
    });

    expect(toFeedbackTemplateResponse(template)).toEqual({
      id: '4f700000-0000-4000-8000-000000000001',
      titulo: 'Boa participação e engajamento',
      texto: 'Demonstrou participação ativa durante a sessão tutorial.',
    });
  });
});
