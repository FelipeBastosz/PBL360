import { SessionGradeCalculator } from './session-grade-calculator';
import { InvalidEvaluationItemsError } from '../errors/invalid-evaluation.error';

const criterion = (id: string, weight: number) => ({
  id,
  weight,
  name: id,
  description: null,
  orderIndex: 1,
});
const items = [
  { criterionId: 'a', score: 7 },
  { criterionId: 'b', score: 9 },
];
const calculateWithCargo = (
  scores: typeof items,
  criteria: ReturnType<typeof criterion>[],
  roleScore: number | null,
) => SessionGradeCalculator.calculate(scores, criteria, roleScore, true);

describe('SessionGradeCalculator', () => {
  it('calculates the weighted mean followed by the standard cargo formula', () => {
    expect(calculateWithCargo(items, [criterion('a', 1), criterion('b', 3)], 5)).toBe(7.45);
  });
  it.each([
    { criteriaWeight: 70, roleWeight: 30 },
    { criteriaWeight: 7, roleWeight: 3 },
  ])('uses the fixed criterion scale with role scores and formula %j', (formula) => {
    const criteria = [criterion('a', 1), criterion('b', 3)];
    expect(SessionGradeCalculator.calculate(items, criteria, 5, true, formula)).toBe(7.45);
    expect(() =>
      SessionGradeCalculator.calculate(
        [{ criterionId: 'a', score: 10.01 }, items[1]!],
        criteria,
        5,
        true,
        formula,
      ),
    ).toThrow('A nota do critério deve estar entre 0 e 10.');
  });
  it('uses the simple weighted mean when the student has no cargo score', () => {
    expect(calculateWithCargo(items, [criterion('a', 1), criterion('b', 3)], null)).toBe(8.5);
  });
  it('calculates a weighted mean for evaluations without the cargo formula', () => {
    expect(SessionGradeCalculator.calculate(items, [criterion('a', 1), criterion('b', 3)], 0)).toBe(
      8.5,
    );
  });
  it('calculates 10 when both criteria and role score are 10', () => {
    expect(
      calculateWithCargo(
        [
          { criterionId: 'a', score: 10 },
          { criterionId: 'b', score: 10 },
        ],
        [criterion('a', 1), criterion('b', 1)],
        10,
      ),
    ).toBe(10);
  });
  it('rounds only the final result, including decimal weights', () => {
    const scores = [
      { criterionId: 'a', score: 1 },
      { criterionId: 'b', score: 1.01 },
    ];
    expect(calculateWithCargo(scores, [criterion('a', 0.1), criterion('b', 0.1)], 0)).toBe(0.7);
    expect(calculateWithCargo(items, [criterion('a', 1), criterion('b', 2)], 0)).toBe(5.83);
  });
  it('accepts zero scores and ignores zero-weight criteria in the mean', () => {
    expect(calculateWithCargo([{ criterionId: 'a', score: 0 }], [criterion('a', 1)], 0)).toBe(0);
    expect(calculateWithCargo(items, [criterion('a', 0), criterion('b', 1)], 0)).toBe(6.3);
  });
  it('rejects an all-zero configuration and missing criteria', () => {
    expect(() => calculateWithCargo(items, [criterion('a', 0), criterion('b', 0)], 0)).toThrow(
      InvalidEvaluationItemsError,
    );
    expect(() => calculateWithCargo([], [criterion('a', 1)], 0)).toThrow(
      InvalidEvaluationItemsError,
    );
  });
  it.each([-0.01, 10.01, NaN])('rejects invalid role score %s', (roleScore) => {
    expect(() =>
      calculateWithCargo(items, [criterion('a', 1), criterion('b', 1)], roleScore),
    ).toThrow(InvalidEvaluationItemsError);
  });

  describe('custom formulas and boundary values across modalities', () => {
    const criteria = [criterion('a', 1), criterion('b', 1)];

    it('calculates with custom 80/20 formula weights', () => {
      const scores = [
        { criterionId: 'a', score: 10 },
        { criterionId: 'b', score: 5 },
      ];
      // Criteria average = 7.5; roleScore = 10. 80% criteria + 20% role = 6 + 2 = 8
      expect(
        SessionGradeCalculator.calculate(scores, criteria, 10, true, {
          criteriaWeight: 80,
          roleWeight: 20,
        }),
      ).toBe(8);
    });

    it('handles boundary role score 0 and 10 correctly', () => {
      const allTen = [
        { criterionId: 'a', score: 10 },
        { criterionId: 'b', score: 10 },
      ];
      const allZero = [
        { criterionId: 'a', score: 0 },
        { criterionId: 'b', score: 0 },
      ];

      // Criteria 10, Role 0: (10 * 70 + 0 * 30) / 100 = 7.0
      expect(SessionGradeCalculator.calculate(allTen, criteria, 0, true)).toBe(7);

      // Criteria 0, Role 10: (0 * 70 + 10 * 30) / 100 = 3.0
      expect(SessionGradeCalculator.calculate(allZero, criteria, 10, true)).toBe(3);

      // Criteria 0, Role 0: 0.0
      expect(SessionGradeCalculator.calculate(allZero, criteria, 0, true)).toBe(0);
    });

    it('redistributes 100% of weight to criteria when student has no cargo (roleScore is null)', () => {
      const scores = [
        { criterionId: 'a', score: 8 },
        { criterionId: 'b', score: 6 },
      ];
      // When roleScore is null, even with applyCargoFormula = true, criteria mean is 7.0
      expect(
        SessionGradeCalculator.calculate(scores, criteria, null, true, {
          criteriaWeight: 80,
          roleWeight: 20,
        }),
      ).toBe(7);
      expect(
        SessionGradeCalculator.calculate(scores, criteria, null, false, {
          criteriaWeight: 80,
          roleWeight: 20,
        }),
      ).toBe(7);
    });

    it('produces identical results across modalities (TUTOR, AUTOAVALIACAO, PARES)', () => {
      const scores = [
        { criterionId: 'a', score: 8.5 },
        { criterionId: 'b', score: 6.5 },
      ];
      const roleScore = 9;
      const formula = { criteriaWeight: 70, roleWeight: 30 };

      const tutorResult = SessionGradeCalculator.calculate(
        scores,
        criteria,
        roleScore,
        true,
        formula,
      );
      const selfResult = SessionGradeCalculator.calculate(
        scores,
        criteria,
        roleScore,
        true,
        formula,
      );
      const peerResult = SessionGradeCalculator.calculate(
        scores,
        criteria,
        roleScore,
        true,
        formula,
      );

      expect(tutorResult).toBe(selfResult);
      expect(selfResult).toBe(peerResult);
      expect(tutorResult).toBe(7.95);
    });
  });
});
