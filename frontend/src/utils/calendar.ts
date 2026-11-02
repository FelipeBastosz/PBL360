import type { DateParts } from './date';

export type CalendarMonth = { month: number; year: number };
export type CalendarDay = DateParts & { inMonth: boolean };

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

// Brazilian calendars start the week on Sunday.
export const WEEKDAYS = [
  { short: 'D', name: 'domingo' },
  { short: 'S', name: 'segunda-feira' },
  { short: 'T', name: 'terça-feira' },
  { short: 'Q', name: 'quarta-feira' },
  { short: 'Q', name: 'quinta-feira' },
  { short: 'S', name: 'sexta-feira' },
  { short: 'S', name: 'sábado' },
];

const DAYS_IN_GRID = 42;

function localDate(year: number, month: number, day: number): Date {
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month - 1, day);
  return date;
}

export function shiftMonth({ month, year }: CalendarMonth, delta: number): CalendarMonth {
  const date = localDate(year, month + delta, 1);
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

/** Six full weeks, so the grid keeps the same height from one month to the next. */
export function buildMonthGrid({ month, year }: CalendarMonth): CalendarDay[] {
  const offset = localDate(year, month, 1).getDay();
  return Array.from({ length: DAYS_IN_GRID }, (_, index) => {
    const date = localDate(year, month, index - offset + 1);
    return {
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      inMonth: date.getMonth() + 1 === month,
    };
  });
}

export function isSameDay(a: DateParts | null, b: DateParts | null): boolean {
  return Boolean(a && b && a.day === b.day && a.month === b.month && a.year === b.year);
}

export function formatMonthTitle({ month, year }: CalendarMonth): string {
  return `${MONTH_NAMES[month - 1]} de ${year}`;
}

/** "15 de outubro de 2026" — the accessible name of a day in the calendar. */
export function formatLongDate({ day, month, year }: DateParts): string {
  return `${day} de ${MONTH_NAMES[month - 1]} de ${year}`;
}
