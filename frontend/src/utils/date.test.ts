import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatDayMonth,
  formatDayShortMonth,
  formatDeadline,
  fromApiDate,
  isValidTime,
  maskDate,
  maskTime,
  parseApiDate,
  parseDisplayDate,
  toApiDate,
  toApiDateTime,
} from './date';

// Built from local parts so the expectations hold in any time zone.
const localInstant = (year: number, month: number, day: number, hour = 0, minute = 0) =>
  new Date(year, month - 1, day, hour, minute).toISOString();

describe('parseApiDate', () => {
  it('reads the DD-MM-AAAA calendar date sent by the API', () => {
    expect(parseApiDate('15-10-2026')).toEqual({ day: 15, month: 10, year: 2026 });
  });

  it('still reads legacy AAAA-MM-DD values', () => {
    expect(parseApiDate('2026-10-15')).toEqual({ day: 15, month: 10, year: 2026 });
  });

  it('rejects dates that do not exist in the calendar', () => {
    expect(parseApiDate('31-02-2026')).toBeNull();
    expect(parseApiDate('ontem')).toBeNull();
    expect(parseApiDate(null)).toBeNull();
  });
});

describe('parseDisplayDate', () => {
  it('reads a DD/MM/AAAA date typed by the user', () => {
    expect(parseDisplayDate('29/02/2028')).toEqual({ day: 29, month: 2, year: 2028 });
  });

  it('rejects incomplete or impossible dates', () => {
    expect(parseDisplayDate('29/02/2027')).toBeNull();
    expect(parseDisplayDate('1/2/2026')).toBeNull();
    expect(parseDisplayDate('')).toBeNull();
  });
});

describe('formatDate', () => {
  it('shows a calendar date from the API as DD/MM/AAAA', () => {
    expect(formatDate('05-03-2026')).toBe('05/03/2026');
  });

  it('does not shift a calendar date by the time zone offset', () => {
    expect(formatDate('01-01-2026')).toBe('01/01/2026');
    expect(formatDate('2026-01-01')).toBe('01/01/2026');
  });

  it('shows an instant in local time as DD/MM/AAAA', () => {
    expect(formatDate(localInstant(2026, 9, 1, 15))).toBe('01/09/2026');
  });

  it('keeps an unexpected value as it is', () => {
    expect(formatDate('ontem')).toBe('ontem');
    expect(formatDate(null)).toBe('');
  });
});

describe('formatDayMonth', () => {
  it('shows a calendar date as day and month', () => {
    expect(formatDayMonth('12-08-2026')).toBe('12/08');
  });

  it('keeps an unexpected value as it is', () => {
    expect(formatDayMonth('ontem')).toBe('ontem');
  });
});

describe('formatDayShortMonth', () => {
  it('shows the day and the short month name', () => {
    expect(formatDayShortMonth('12-08-2026')).toBe('12 ago');
    expect(formatDayShortMonth('05-03-2026')).toBe('5 mar');
  });

  it('reads an instant in local time', () => {
    expect(formatDayShortMonth(localInstant(2026, 10, 15, 23, 30))).toBe('15 out');
  });
});

describe('formatDateTime', () => {
  it('shows an instant as DD/MM/AAAA às HH:MM in local time', () => {
    expect(formatDateTime(localInstant(2026, 10, 15, 14, 5))).toBe('15/10/2026 às 14:05');
  });

  it('keeps an unexpected value as it is', () => {
    expect(formatDateTime('invalid-date')).toBe('invalid-date');
  });
});

describe('formatDeadline', () => {
  it('returns the fallback when there is no deadline', () => {
    expect(formatDeadline(null)).toBe('Sem prazo limite');
    expect(formatDeadline(undefined)).toBe('Sem prazo limite');
    expect(formatDeadline('')).toBe('Sem prazo limite');
  });

  it('shows the deadline date and time', () => {
    expect(formatDeadline(localInstant(2026, 10, 15, 17))).toBe('Até 15/10/2026 às 17:00');
  });

  it('returns an invalid value as it is', () => {
    expect(formatDeadline('invalid-date')).toBe('invalid-date');
  });
});

describe('toApiDate / fromApiDate', () => {
  it('converts the typed date to the DD-MM-AAAA payload expected by the API', () => {
    expect(toApiDate('20/10/2026')).toBe('20-10-2026');
  });

  it('refuses to convert an invalid date', () => {
    expect(toApiDate('32/10/2026')).toBeNull();
  });

  it('turns the API date back into the field format', () => {
    expect(fromApiDate('20-10-2026')).toBe('20/10/2026');
    expect(fromApiDate(undefined)).toBe('');
  });
});

describe('toApiDateTime', () => {
  it('converts a local date and time to an ISO instant', () => {
    expect(toApiDateTime('15/10/2026', '14:30')).toBe(localInstant(2026, 10, 15, 14, 30));
  });

  it('returns null when the date or the time is invalid', () => {
    expect(toApiDateTime('15/13/2026', '14:30')).toBeNull();
    expect(toApiDateTime('15/10/2026', '24:00')).toBeNull();
  });
});

describe('isValidTime', () => {
  it('accepts 24-hour times only', () => {
    expect(isValidTime('00:00')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('7:30')).toBe(false);
    expect(isValidTime('25:00')).toBe(false);
  });
});

describe('maskDate / maskTime', () => {
  it('inserts the separators while the user types', () => {
    expect(maskDate('1')).toBe('1');
    expect(maskDate('151')).toBe('15/1');
    expect(maskDate('15102026')).toBe('15/10/2026');
    expect(maskDate('15/10/20269')).toBe('15/10/2026');
    expect(maskTime('1430')).toBe('14:30');
  });

  it('drops anything that is not a digit', () => {
    expect(maskDate('ab15-10')).toBe('15/10');
    expect(maskTime('')).toBe('');
  });
});
