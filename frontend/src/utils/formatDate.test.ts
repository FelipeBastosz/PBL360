import { describe, expect, it } from 'vitest';
import { formatDeadline, formatDayMonth, formatDayShortMonth, formatFullDate } from './formatDate';

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

describe('formatDeadline', () => {
  it('returns fallback when isoDate is empty or null', () => {
    expect(formatDeadline(null)).toBe('Sem prazo limite');
    expect(formatDeadline(undefined)).toBe('Sem prazo limite');
    expect(formatDeadline('')).toBe('Sem prazo limite');
  });

  it('formats valid ISO date with day, short month, and time', () => {
    const formatted = formatDeadline('2026-10-15T17:00:00.000Z');
    expect(formatted).toMatch(/Até \d{2} de \w+\.? às \d{2}:\d{2}/i);
  });

  it('returns invalid date string as is', () => {
    expect(formatDeadline('invalid-date')).toBe('invalid-date');
  });
});
