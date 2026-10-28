import { describe, expect, it } from 'vitest';
import { formatPokerGrade, formatPokerVote, parsePokerGrade, roundToTenths } from './pokerFormat';

describe('pokerFormat', () => {
  it.each([
    [8.75, '8,8'],
    [8.74, '8,7'],
    [8, '8,0'],
    [10, '10,0'],
  ])('formats the grade %p with one decimal place', (value, expected) => {
    expect(formatPokerGrade(value)).toBe(expected);
  });

  it('shows a dash when there is no grade', () => {
    expect(formatPokerGrade(null)).toBe('—');
    expect(formatPokerGrade(undefined)).toBe('—');
  });

  it('formats a vote without trailing zeros', () => {
    expect(formatPokerVote(7)).toBe('7');
    expect(formatPokerVote(7.55)).toBe('7,6');
  });

  it('parses a typed grade rounded to tenths and clamped to the scale', () => {
    expect(parsePokerGrade('8,46')).toBe(8.5);
    expect(parsePokerGrade('11')).toBe(10);
    expect(parsePokerGrade('abc')).toBeNull();
  });

  it('rounds to tenths', () => {
    expect(roundToTenths(8.25)).toBe(8.3);
  });
});
