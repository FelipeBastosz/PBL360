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
  ])('combines configurable criterion limits with role scores using %j', (formula) => {
    const criteria = [
      { ...criterion('a', 1), maxScore: 7 },
      { ...criterion('b', 3), maxScore: 9 },
    ];
    expect(SessionGradeCalculator.calculate(items, criteria, 5, true, formula)).toBe(7.45);
    expect(() =>
      SessionGradeCalculator.calculate(
        [{ criterionId: 'a', score: 7.01 }, items[1]!],
        criteria,
        5,
        true,
        formula,
      ),
    ).toThrow('A nota do critério deve estar entre 0 e 7.');
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
});
