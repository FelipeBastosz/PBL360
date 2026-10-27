import { Formula, FormulaScope } from './formula.entity';
import { FormulaComponentType } from './formula-component.entity';
import { InvalidProblemError } from '../errors/invalid-problem.error';

describe('Formula', () => {
  const defaultFormulaProps = {
    sessionId: 'session-1',
    scope: FormulaScope.SESSAO,
    createdBy: 'tutor-1',
    components: [
      { type: FormulaComponentType.CRITERIOS, weight: 70 },
      { type: FormulaComponentType.PAPEL, weight: 30 },
    ],
  };

  it('deve criar uma fórmula válida quando a soma dos pesos for 100', () => {
    const formula = Formula.create(defaultFormulaProps);

    expect(formula).toBeDefined();
    expect(formula.components).toHaveLength(2);
    expect(formula.active).toBe(true);
    expect(formula.version).toBe(1);
  });

  it('deve lançar erro se a soma dos pesos for diferente de 100', () => {
    const invalidProps = {
      ...defaultFormulaProps,
      components: [
        { type: FormulaComponentType.CRITERIOS, weight: 40 },
        { type: FormulaComponentType.PAPEL, weight: 50 },
      ],
    };

    expect(() => Formula.create(invalidProps)).toThrow(InvalidProblemError);
    expect(() => Formula.create(invalidProps)).toThrow('exatamente 100%');
  });

  it('deve permitir pequena margem de arredondamento em dízimas', () => {
    const roundingProps = {
      ...defaultFormulaProps,
      components: [
        { type: FormulaComponentType.CRITERIOS, weight: 33.33 },
        { type: FormulaComponentType.PAPEL, weight: 66.675 },
      ],
    };

    const formula = Formula.create(roundingProps);
    expect(formula.components).toHaveLength(2);
  });

  it('deve rejeitar componentes diferentes dos blocos da fórmula de sessão', () => {
    const invalidProps = {
      ...defaultFormulaProps,
      components: [
        { type: FormulaComponentType.CRITERIOS, weight: 50 },
        { type: FormulaComponentType.MEDIA_SESSOES, referenceId: null, weight: 50 },
      ],
    };

    expect(() => Formula.create(invalidProps)).toThrow(InvalidProblemError);
    expect(() => Formula.create(invalidProps)).toThrow(
      'A fórmula da sessão deve conter exatamente um componente CRITERIOS e um PAPEL',
    );
  });

  it('deve lançar erro se escopo PROBLEMA contiver CRITERIO', () => {
    const invalidProps = {
      problemId: 'uuid-1',
      scope: FormulaScope.PROBLEMA,
      createdBy: 'tutor-1',
      components: [
        { type: FormulaComponentType.MEDIA_SESSOES, referenceId: null, weight: 80 },
        { type: FormulaComponentType.CRITERIO, referenceId: 'crit-1', weight: 20 },
      ],
    };

    expect(() => Formula.create(invalidProps)).toThrow(InvalidProblemError);
    expect(() => Formula.create(invalidProps)).toThrow(
      'Componente inválido para a fórmula da nota final',
    );
  });
});
