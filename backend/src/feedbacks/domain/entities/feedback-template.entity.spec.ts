import { FeedbackTemplate, InvalidFeedbackTemplateError } from './feedback-template.entity';

describe('FeedbackTemplate Entity', () => {
  const validProps = () => ({
    title: 'Boa participação e engajamento',
    text: 'Demonstrou participação ativa durante a sessão tutorial.',
  });

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

  it('creates a feedback template with maximum allowed boundary lengths', () => {
    const template = FeedbackTemplate.create({
      title: 'a'.repeat(120),
      text: 'b'.repeat(2000),
    });

    expect(template.title).toHaveLength(120);
    expect(template.text).toHaveLength(2000);
  });

  it('throws InvalidFeedbackTemplateError when title is empty', () => {
    expect(() =>
      FeedbackTemplate.create({
        ...validProps(),
        title: '',
      }),
    ).toThrow(new InvalidFeedbackTemplateError('O título do modelo de feedback é obrigatório.'));
  });

  it('throws InvalidFeedbackTemplateError when title consists only of whitespace', () => {
    expect(() =>
      FeedbackTemplate.create({
        ...validProps(),
        title: '    ',
      }),
    ).toThrow(new InvalidFeedbackTemplateError('O título do modelo de feedback é obrigatório.'));
  });

  it('throws InvalidFeedbackTemplateError when title exceeds 120 characters', () => {
    expect(() =>
      FeedbackTemplate.create({
        ...validProps(),
        title: 'a'.repeat(121),
      }),
    ).toThrow(
      new InvalidFeedbackTemplateError(
        'O título do modelo de feedback deve ter no máximo 120 caracteres.',
      ),
    );
  });

  it('throws InvalidFeedbackTemplateError when text is empty', () => {
    expect(() =>
      FeedbackTemplate.create({
        ...validProps(),
        text: '',
      }),
    ).toThrow(new InvalidFeedbackTemplateError('O texto do modelo de feedback é obrigatório.'));
  });

  it('throws InvalidFeedbackTemplateError when text consists only of whitespace', () => {
    expect(() =>
      FeedbackTemplate.create({
        ...validProps(),
        text: '    ',
      }),
    ).toThrow(new InvalidFeedbackTemplateError('O texto do modelo de feedback é obrigatório.'));
  });

  it('throws InvalidFeedbackTemplateError when text exceeds 2000 characters', () => {
    expect(() =>
      FeedbackTemplate.create({
        ...validProps(),
        text: 'a'.repeat(2001),
      }),
    ).toThrow(
      new InvalidFeedbackTemplateError(
        'O texto do modelo de feedback deve ter no máximo 2000 caracteres.',
      ),
    );
  });

  it('ensures InvalidFeedbackTemplateError inherits from DomainError', () => {
    expect(() =>
      FeedbackTemplate.create({
        ...validProps(),
        title: '',
      }),
    ).toThrow(InvalidFeedbackTemplateError);
  });
});
