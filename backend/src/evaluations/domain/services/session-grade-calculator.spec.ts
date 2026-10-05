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

describe('SessionGradeCalculator', () => {
  it('calculates the weighted mean and role bonus', () => {
    expect(
      SessionGradeCalculator.calculate(items, [criterion('a', 1), criterion('b', 3)], 0.5),
    ).toBe(9);
  });
  it('caps the result at ten', () => {
    expect(
      SessionGradeCalculator.calculate([{ criterionId: 'a', score: 9.8 }], [criterion('a', 1)], 1),
    ).toBe(10);
  });
  it('rounds only the final result, including decimal weights', () => {
    const scores = [
      { criterionId: 'a', score: 1 },
      { criterionId: 'b', score: 1.01 },
    ];
    expect(
      SessionGradeCalculator.calculate(scores, [criterion('a', 0.1), criterion('b', 0.1)], 0),
    ).toBe(1.01);
    expect(SessionGradeCalculator.calculate(items, [criterion('a', 1), criterion('b', 2)], 0)).toBe(
      8.33,
    );
  });
  it('accepts zero scores and ignores zero-weight criteria in the mean', () => {
    expect(
      SessionGradeCalculator.calculate([{ criterionId: 'a', score: 0 }], [criterion('a', 1)], 0),
    ).toBe(0);
    expect(SessionGradeCalculator.calculate(items, [criterion('a', 0), criterion('b', 1)], 0)).toBe(
      9,
    );
  });
  it('rejects an all-zero configuration and missing criteria', () => {
    expect(() =>
      SessionGradeCalculator.calculate(items, [criterion('a', 0), criterion('b', 0)], 0),
    ).toThrow(InvalidEvaluationItemsError);
    expect(() => SessionGradeCalculator.calculate([], [criterion('a', 1)], 0)).toThrow(
      InvalidEvaluationItemsError,
    );
  });
  it.each([-1, 1.01, NaN])('rejects invalid bonus %s', (bonus) => {
    expect(() =>
      SessionGradeCalculator.calculate(items, [criterion('a', 1), criterion('b', 1)], bonus),
    ).toThrow(InvalidEvaluationItemsError);
  });
});
