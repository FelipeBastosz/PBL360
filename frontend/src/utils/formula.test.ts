import { describe, expect, it } from 'vitest';
import type { FormulaComponent } from '@/types/formula';
import { componentName, formatWeight, isBalanced, missingComponents, totalWeight } from './formula';

const criterion = (id: string, peso: number): FormulaComponent => ({
  tipo: 'CRITERIO',
  referenciaId: id,
  nome: `Critério ${id}`,
  peso,
});

describe('totalWeight and isBalanced', () => {
  it('accepts the 0.01 rounding of the default weights', () => {
    const components = [criterion('a', 33.33), criterion('b', 33.33), criterion('c', 33.34)];

    expect(totalWeight(components)).toBe(100);
    expect(isBalanced(components)).toBe(true);
  });

  it('rejects a sum different from 100', () => {
    expect(isBalanced([criterion('a', 60), criterion('b', 30)])).toBe(false);
  });
});

describe('formatWeight', () => {
  it('uses a comma and drops useless decimals', () => {
    expect(formatWeight(30)).toBe('30%');
    expect(formatWeight(33.333)).toBe('33,33%');
  });
});

describe('componentName', () => {
  it('falls back to the name of the session average component', () => {
    expect(
      componentName({ tipo: 'MEDIA_SESSOES', referenciaId: null, nome: null, peso: 100 }),
    ).toBe('Média das Sessões');
  });
});

describe('missingComponents', () => {
  it('offers the table criteria that are not in the session formula', () => {
    const options = missingComponents(
      'SESSAO',
      [criterion('a', 100)],
      [
        { id: 'a', nome: 'Seguimento' },
        { id: 'b', nome: 'Participação' },
      ],
    );

    expect(options).toEqual([
      { tipo: 'CRITERIO', referenciaId: 'b', nome: 'Participação', peso: 0 },
    ]);
  });

  it('offers no extra components after the session average is configured', () => {
    const current: FormulaComponent[] = [
      { tipo: 'MEDIA_SESSOES', referenciaId: null, nome: 'Média das Sessões', peso: 100 },
    ];

    expect(missingComponents('PROBLEMA', current, [])).toEqual([]);
  });
});
