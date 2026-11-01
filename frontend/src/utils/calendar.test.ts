import { describe, expect, it } from 'vitest';
import {
  buildMonthGrid,
  formatLongDate,
  formatMonthTitle,
  isSameDay,
  shiftMonth,
} from './calendar';

describe('buildMonthGrid', () => {
  it('starts the grid on the Sunday before the first day of the month', () => {
    const grid = buildMonthGrid({ month: 10, year: 2026 });

    expect(grid).toHaveLength(42);
    // 1 October 2026 is a Thursday, so the grid opens on Sunday 27 September
    expect(grid[0]).toEqual({ day: 27, month: 9, year: 2026, inMonth: false });
    expect(grid[4]).toEqual({ day: 1, month: 10, year: 2026, inMonth: true });
  });

  it('marks only the days of the month as part of it', () => {
    const grid = buildMonthGrid({ month: 2, year: 2028 });

    expect(grid.filter((day) => day.inMonth)).toHaveLength(29);
  });
});

describe('shiftMonth', () => {
  it('moves across the year boundary', () => {
    expect(shiftMonth({ month: 12, year: 2026 }, 1)).toEqual({ month: 1, year: 2027 });
    expect(shiftMonth({ month: 1, year: 2026 }, -1)).toEqual({ month: 12, year: 2025 });
  });
});

describe('isSameDay', () => {
  it('compares the calendar day only', () => {
    const day = { day: 15, month: 10, year: 2026 };

    expect(isSameDay(day, { ...day })).toBe(true);
    expect(isSameDay(day, { ...day, year: 2027 })).toBe(false);
    expect(isSameDay(day, null)).toBe(false);
  });
});

describe('calendar labels', () => {
  it('names the month and the day in Portuguese', () => {
    expect(formatMonthTitle({ month: 3, year: 2026 })).toBe('março de 2026');
    expect(formatLongDate({ day: 15, month: 10, year: 2026 })).toBe('15 de outubro de 2026');
  });
});
