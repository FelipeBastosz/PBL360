import { getMetadataArgsStorage } from 'typeorm';
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

  it('declares a database generated timestamp default', () => {
    const createdAt = getMetadataArgsStorage().columns.find(
      ({ target, propertyName }) => target === CommitmentTerm && propertyName === 'createdAt',
    );

    expect(typeof createdAt?.options.default).toBe('function');
    expect(
      Reflect.apply(createdAt!.options.default as (...args: never[]) => unknown, undefined, []),
    ).toBe('now()');
  });
});
