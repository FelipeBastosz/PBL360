import { describe, expect, it } from 'vitest';
import { countLabel } from './countLabel';

describe('countLabel', () => {
  it('uses the singular form only for exactly one', () => {
    expect(countLabel(1, 'aluno', 'alunos')).toBe('1 aluno');
  });

  it('uses the plural form for zero and for many', () => {
    expect(countLabel(0, 'aluno', 'alunos')).toBe('0 alunos');
    expect(countLabel(3, 'problema', 'problemas')).toBe('3 problemas');
  });
});
