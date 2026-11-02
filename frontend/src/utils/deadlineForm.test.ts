import { describe, expect, it } from 'vitest';
import { resolveDeadline, validateDeadline } from './deadlineForm';

const localInstant = (year: number, month: number, day: number, hour: number, minute: number) =>
  new Date(year, month - 1, day, hour, minute).toISOString();

describe('validateDeadline', () => {
  it('accepts an empty deadline', () => {
    expect(validateDeadline({ date: '', time: '' })).toEqual({});
  });

  it('asks for the date when only the time was typed', () => {
    expect(validateDeadline({ date: '', time: '14:00' }).date).toBe('Informe a data do prazo.');
  });

  it('rejects an invalid date or time', () => {
    expect(validateDeadline({ date: '31/04/2026', time: '' }).date).toBe(
      'Informe uma data válida no formato DD/MM/AAAA.',
    );
    expect(validateDeadline({ date: '30/04/2026', time: '9:7' }).time).toBe(
      'Informe um horário válido no formato HH:MM.',
    );
  });
});

describe('resolveDeadline', () => {
  it('returns null when no deadline was chosen', () => {
    expect(resolveDeadline({ date: '', time: '' })).toEqual({ ok: true, prazo: null });
  });

  it('sends the chosen local date and time as an ISO instant', () => {
    expect(resolveDeadline({ date: '15/10/2026', time: '14:30' })).toEqual({
      ok: true,
      prazo: localInstant(2026, 10, 15, 14, 30),
    });
  });

  it('runs until the end of the day when no time was chosen', () => {
    expect(resolveDeadline({ date: '15/10/2026', time: '' })).toEqual({
      ok: true,
      prazo: localInstant(2026, 10, 15, 23, 59),
    });
  });

  it('reports the errors instead of a deadline', () => {
    expect(resolveDeadline({ date: '15/13/2026', time: '' }).ok).toBe(false);
  });
});
