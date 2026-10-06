import { describe, expect, it } from 'vitest';
import { formatDayMonth, formatDayShortMonth, formatFullDate } from './formatDate';

describe('formatDayMonth', () => {
  it('shows a calendar date as day and month', () => {
    expect(formatDayMonth('2026-08-12')).toBe('12/08');
  });

  it('keeps an unexpected value as it is', () => {
    expect(formatDayMonth('ontem')).toBe('ontem');
  });
});

describe('formatFullDate', () => {
  it('shows a timestamp as a full Brazilian date', () => {
    expect(formatFullDate('2026-09-01T15:00:00.000Z')).toBe('01/09/2026');
  });

  it('keeps an unexpected value as it is', () => {
    expect(formatFullDate('ontem')).toBe('ontem');
  });
});

describe('formatDayShortMonth', () => {
  it('shows the day and the short month name', () => {
    expect(formatDayShortMonth('2026-08-12')).toBe('12 ago');
    expect(formatDayShortMonth('2026-03-05')).toBe('5 mar');
  });
});
