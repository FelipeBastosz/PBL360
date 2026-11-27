import { getMetadataArgsStorage } from 'typeorm';
import { Session } from '@/sessions/domain/entities/session.entity';
import { User } from '@/users/domain/entities/user.entity';
import { Formula, FormulaScope } from './formula.entity';
import { FormulaComponent, FormulaComponentType } from './formula-component.entity';
import { Problem } from './problem.entity';
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

  it.each([FormulaComponentType.AUTOAVALIACAO, FormulaComponentType.PARES])(
    'deve rejeitar %s como componente da fórmula do problema',
    (type) => {
      expect(() =>
        Formula.create({
          problemId: 'problem-1',
          scope: FormulaScope.PROBLEMA,
          createdBy: 'tutor-1',
          components: [
            { type: FormulaComponentType.MEDIA_SESSOES, weight: 80 },
            { type, weight: 20 },
          ],
        }),
      ).toThrow(InvalidProblemError);
    },
  );

  describe('PROFESSOR scope', () => {
    const validProfessorProps = {
      scope: FormulaScope.PROFESSOR,
      createdBy: 'tutor-1',
      components: [
        { type: FormulaComponentType.CRITERIOS, weight: 60 },
        { type: FormulaComponentType.PAPEL, weight: 40 },
      ],
    };

    it('creates a valid professor formula with CRITERIOS and PAPEL summing to 100', () => {
      const formula = Formula.create(validProfessorProps);
      expect(formula).toBeDefined();
      expect(formula.scope).toBe(FormulaScope.PROFESSOR);
      expect(formula.problemId).toBeNull();
      expect(formula.sessionId).toBeNull();
      expect(formula.createdBy).toBe('tutor-1');
      expect(formula.components).toHaveLength(2);
    });

    it('rejects professor formula if problemId or sessionId is informed', () => {
      expect(() =>
        Formula.create({
          ...validProfessorProps,
          problemId: 'problem-1',
        }),
      ).toThrow('A fórmula do professor não deve estar vinculada a problema ou sessão.');

      expect(() =>
        Formula.create({
          ...validProfessorProps,
          sessionId: 'session-1',
        }),
      ).toThrow('A fórmula do professor não deve estar vinculada a problema ou sessão.');
    });

    it('rejects professor formula without createdBy', () => {
      expect(() =>
        Formula.create({
          ...validProfessorProps,
          createdBy: '',
        }),
      ).toThrow('O autor da fórmula é obrigatório.');
    });

    it('rejects professor formula if weights do not sum to 100', () => {
      expect(() =>
        Formula.create({
          ...validProfessorProps,
          components: [
            { type: FormulaComponentType.CRITERIOS, weight: 50 },
            { type: FormulaComponentType.PAPEL, weight: 40 },
          ],
        }),
      ).toThrow('A soma dos pesos dos componentes deve ser exatamente 100%.');
    });

    it('rejects professor formula with invalid components', () => {
      expect(() =>
        Formula.create({
          ...validProfessorProps,
          components: [
            { type: FormulaComponentType.CRITERIOS, weight: 50 },
            { type: FormulaComponentType.MEDIA_SESSOES, weight: 50 },
          ],
        }),
      ).toThrow('A fórmula da sessão deve conter exatamente um componente CRITERIOS e um PAPEL.');
    });
  });

  it('rejects missing problemId/sessionId, empty components, and missing MEDIA_SESSOES', () => {
    expect(() =>
      Formula.create({
        scope: FormulaScope.PROBLEMA,
        createdBy: 'tutor-1',
        components: [{ type: FormulaComponentType.MEDIA_SESSOES, weight: 100 }],
      }),
    ).toThrow('A fórmula precisa estar vinculada a um problema.');

    expect(() =>
      Formula.create({
        scope: FormulaScope.SESSAO,
        createdBy: 'tutor-1',
        components: [
          { type: FormulaComponentType.CRITERIOS, weight: 70 },
          { type: FormulaComponentType.PAPEL, weight: 30 },
        ],
      }),
    ).toThrow('A fórmula precisa estar vinculada a uma sessão.');

    expect(() =>
      Formula.create({
        problemId: 'problem-1',
        scope: FormulaScope.PROBLEMA,
        createdBy: 'tutor-1',
        components: [],
      }),
    ).toThrow('A fórmula precisa ter ao menos um componente.');

    expect(() =>
      Formula.create({
        problemId: 'problem-1',
        scope: FormulaScope.PROBLEMA,
        createdBy: 'tutor-1',
        components: [{ type: FormulaComponentType.SESSAO, referenceId: 's-1', weight: 1 }],
      }),
    ).toThrow('A fórmula do problema deve conter exatamente um componente MEDIA_SESSOES.');
  });

  it('maps problem, session, components and creator relationships', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      (relation) => relation.target === Formula,
    );
    const targets = relations.map((relation) =>
      typeof relation.type === 'function' ? (relation.type() as unknown) : relation.type,
    );
    const componentsRel = relations.find((relation) => relation.propertyName === 'components');
    const inverse = componentsRel?.inverseSideProperty as
      ((component: { formula: string }) => string) | undefined;

    expect(targets).toEqual([Problem, Session, FormulaComponent, User]);
    expect(inverse?.({ formula: 'f-1' })).toBe('f-1');
  });
});
