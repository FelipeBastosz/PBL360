import { CommitmentTerm } from './commitment-term.entity';

describe('CommitmentTerm', () => {
  it('creates a term with trimmed values and current timestamp', () => {
    const term = CommitmentTerm.create({
      version: '  1.0  ',
      title: '  Termo de Uso  ',
      content: '  Conteúdo do termo  ',
      isCurrent: true,
    });

    expect(term.version).toBe('1.0');
    expect(term.title).toBe('Termo de Uso');
    expect(term.content).toBe('Conteúdo do termo');
    expect(term.isCurrent).toBe(true);
    expect(term.createdAt).toBeInstanceOf(Date);
  });
});
