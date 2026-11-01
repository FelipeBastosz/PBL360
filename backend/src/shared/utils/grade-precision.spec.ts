import { roundGrade, roundToDecimals } from './grade-precision';

describe('grade-precision', () => {
  describe('roundGrade', () => {
    it('rounds numbers to 1 decimal place', () => {
      expect(roundGrade(8.55)).toBe(8.6);
      expect(roundGrade(8.54)).toBe(8.5);
      expect(roundGrade(7)).toBe(7);
      expect(roundGrade(7.0)).toBe(7);
      expect(roundGrade(7.04)).toBe(7.0);
      expect(roundGrade(9.95)).toBe(10);
    });

    it('correctly handles classic JavaScript floating-point errors', () => {
      expect(roundGrade(0.1 + 0.2)).toBe(0.3);
      expect(roundGrade(0.7 + 0.1)).toBe(0.8);
      expect(roundGrade(0.2 + 0.4)).toBe(0.6);
      expect(roundGrade(1.05)).toBe(1.1);
      expect(roundGrade(8.55)).toBe(8.6);
    });

    it('correctly rounds periodic decimals and fractions', () => {
      expect(roundGrade(10 / 3)).toBe(3.3);
      expect(roundGrade(7 / 3)).toBe(2.3);
      expect(roundGrade(2 / 3)).toBe(0.7);
      expect(roundGrade(1 / 6)).toBe(0.2);
      expect(roundGrade(5 / 6)).toBe(0.8);
      expect(roundGrade(1 / 7)).toBe(0.1);
      expect(roundGrade(22 / 7)).toBe(3.1);
    });

    it('safely handles non-finite, null, and undefined values', () => {
      expect(roundGrade(null)).toBeNull();
      expect(roundGrade(undefined)).toBeNull();
      expect(roundGrade(Number.NaN)).toBeNull();
      expect(roundGrade(Number.POSITIVE_INFINITY)).toBeNull();
      expect(roundGrade(Number.NEGATIVE_INFINITY)).toBeNull();
    });

    it('handles zero and avoids returning -0', () => {
      expect(roundGrade(0)).toBe(0);
      expect(Object.is(roundGrade(0), 0)).toBe(true);
      expect(Object.is(roundGrade(-0.01), 0)).toBe(true);
      expect(Object.is(roundGrade(-0), 0)).toBe(true);
    });
  });

  describe('roundToDecimals', () => {
    it('rounds to specified decimal places and resolves IEEE 754 precision issues', () => {
      expect(roundToDecimals(1.005, 2)).toBe(1.01);
      expect(roundToDecimals(8.555, 2)).toBe(8.56);
      expect(roundToDecimals(8.554, 2)).toBe(8.55);
      expect(roundToDecimals(10 / 3, 3)).toBe(3.333);
      expect(roundToDecimals(7.89, 0)).toBe(8);
      expect(roundToDecimals(7.12, 0)).toBe(7);
    });

    it('defaults to 1 decimal place when decimals argument is omitted', () => {
      expect(roundToDecimals(8.74)).toBe(8.7);
      expect(roundToDecimals(8.76)).toBe(8.8);
    });

    it('returns null for invalid inputs', () => {
      expect(roundToDecimals(null, 2)).toBeNull();
      expect(roundToDecimals(undefined, 2)).toBeNull();
      expect(roundToDecimals(Number.NaN, 2)).toBeNull();
    });
  });
});
