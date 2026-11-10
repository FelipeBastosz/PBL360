import { describe, expect, it } from 'vitest';
import { formatGrade, roundGrade } from './formatGrade';

describe('formatGrade', () => {
  it.each([
    [8.7, '8,7'],
    [8.5, '8,5'],
    [8.54, '8,5'],
    [8.75, '8,8'],
    [8.74, '8,7'],
    [8.25, '8,3'],
    [1.05, '1,1'],
    [7.333333, '7,3'],
    [9.96, '10,0'],
    [8, '8,0'],
    [10, '10,0'],
    [0, '0,0'],
  ])('formats %p as %p', (value, expected) => {
    expect(formatGrade(value)).toBe(expected);
  });

  it('never shows more than one decimal place nor a dot', () => {
    for (let cents = 0; cents <= 1000; cents += 1) {
      expect(formatGrade(cents / 100)).toMatch(/^\d{1,2},\d$/);
    }
  });

  it('shows a dash when there is no grade', () => {
    expect(formatGrade(null)).toBe('—');
    expect(formatGrade(undefined)).toBe('—');
    expect(formatGrade(Number.NaN)).toBe('—');
  });

  it('does not show a negative zero', () => {
    expect(formatGrade(-0.01)).toBe('0,0');
  });
});

describe('roundGrade', () => {
  it('rounds to tenths', () => {
    expect(roundGrade(8.25)).toBe(8.3);
    expect(roundGrade(8.24)).toBe(8.2);
  });
});
