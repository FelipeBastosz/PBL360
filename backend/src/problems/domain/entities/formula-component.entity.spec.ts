import { InvalidProblemError } from '../errors/invalid-problem.error';
import { FormulaScope } from './formula.entity';
import { FormulaComponent, FormulaComponentType } from './formula-component.entity';

const component = (
  type: FormulaComponentType | string,
  weight: number,
  referenceId: string | null = null,
): FormulaComponent => Object.assign(new FormulaComponent(), { type, weight, referenceId });

describe('FormulaComponent.assertIsValid', () => {
  it.each([1, 10])('accepts a problem session weight at boundary %s with a reference', (weight) => {
    expect(() =>
      component(FormulaComponentType.SESSAO, weight, 'session-1').assertIsValid(
        FormulaScope.PROBLEMA,
      ),
    ).not.toThrow();
  });

  it.each([
    { weight: 0, referenceId: 'session-1' },
    { weight: 11, referenceId: 'session-1' },
    { weight: 5, referenceId: null },
  ])('rejects an invalid problem session component: %o', ({ weight, referenceId }) => {
    expect(() =>
      component(FormulaComponentType.SESSAO, weight, referenceId).assertIsValid(
        FormulaScope.PROBLEMA,
      ),
    ).toThrow(InvalidProblemError);
  });

  it.each([-1, 101])('rejects component weights outside 0 through 100: %s', (weight) => {
    expect(() =>
      component(FormulaComponentType.CRITERIOS, weight).assertIsValid(FormulaScope.SESSAO),
    ).toThrow(InvalidProblemError);
  });

  it.each([FormulaScope.SESSAO, FormulaScope.PROFESSOR])(
    'accepts CRITERIOS or PAPEL without a reference in %s scope',
    (scope) => {
      expect(() => component(FormulaComponentType.CRITERIOS, 0).assertIsValid(scope)).not.toThrow();
      expect(() => component(FormulaComponentType.PAPEL, 100).assertIsValid(scope)).not.toThrow();
    },
  );

  it.each([FormulaScope.SESSAO, FormulaScope.PROFESSOR])(
    'rejects unsupported types and references in %s scope',
    (scope) => {
      expect(() => component(FormulaComponentType.SESSAO, 50).assertIsValid(scope)).toThrow(
        'Fórmulas de sessão só podem conter componentes CRITERIOS ou PAPEL.',
      );
      expect(() =>
        component(FormulaComponentType.CRITERIOS, 50, 'criterion-1').assertIsValid(scope),
      ).toThrow('Os componentes da fórmula da sessão não usam referência.');
    },
  );

  it('accepts a problem session component and media component without criterion references', () => {
    expect(() =>
      component(FormulaComponentType.SESSAO, 5, 'session-1').assertIsValid(FormulaScope.PROBLEMA),
    ).not.toThrow();
    expect(() =>
      component(FormulaComponentType.MEDIA_SESSOES, 100).assertIsValid(FormulaScope.PROBLEMA),
    ).not.toThrow();
  });

  it('rejects unsupported problem components and references on media components', () => {
    expect(() =>
      component(FormulaComponentType.CRITERIOS, 50).assertIsValid(FormulaScope.PROBLEMA),
    ).toThrow('Componente inválido para a fórmula da nota final do problema.');
    expect(() =>
      component(FormulaComponentType.MEDIA_SESSOES, 50, 'criterion-1').assertIsValid(
        FormulaScope.PROBLEMA,
      ),
    ).toThrow('Componentes da nota final do problema não utilizam referência de critério.');
  });
});
