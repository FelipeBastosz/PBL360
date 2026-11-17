import { FeedbackTemplate } from './feedback-template.entity';

describe('FeedbackTemplate Entity', () => {
  it('creates a trimmed feedback template with timestamps', () => {
    const template = FeedbackTemplate.create({
      title: '  Boa participação e engajamento  ',
      text: '  Demonstrou participação ativa durante a sessão tutorial.  ',
    });

    expect(template.title).toBe('Boa participação e engajamento');
    expect(template.text).toBe('Demonstrou participação ativa durante a sessão tutorial.');
    expect(template.createdAt).toBeInstanceOf(Date);
    expect(template.updatedAt).toEqual(template.createdAt);
  });
});
