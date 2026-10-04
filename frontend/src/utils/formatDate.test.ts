import { describe, expect, it } from 'vitest';
import { formatDayMonth } from './formatDate';

describe('formatDayMonth', () => {
  it('shows a calendar date as day and month', () => {
    expect(formatDayMonth('2026-08-12')).toBe('12/08');
  });

  it('keeps an unexpected value as it is', () => {
    expect(formatDayMonth('ontem')).toBe('ontem');
  });
});
