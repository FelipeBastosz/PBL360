import { isValidTime, parseDisplayDate, toApiDateTime } from './date';

export type DeadlineDraft = { date: string; time: string };
export type DeadlineErrors = Partial<Record<keyof DeadlineDraft, string>>;
export type DeadlineResult =
  { ok: true; prazo: string | null } | { ok: false; errors: DeadlineErrors };

export const EMPTY_DEADLINE: DeadlineDraft = { date: '', time: '' };

// Without a time, the deadline runs until the end of the chosen day.
export const END_OF_DAY = '23:59';

export function validateDeadline({ date, time }: DeadlineDraft): DeadlineErrors {
  const errors: DeadlineErrors = {};
  if (!date && time) errors.date = 'Informe a data do prazo.';
  else if (date && !parseDisplayDate(date)) {
    errors.date = 'Informe uma data válida no formato DD/MM/AAAA.';
  }
  if (time && !isValidTime(time)) errors.time = 'Informe um horário válido no formato HH:MM.';
  return errors;
}

/** Turns the typed deadline into the ISO 8601 instant the API expects, or null for no deadline. */
export function resolveDeadline(draft: DeadlineDraft): DeadlineResult {
  const errors = validateDeadline(draft);
  if (errors.date || errors.time) return { ok: false, errors };
  if (!draft.date) return { ok: true, prazo: null };
  return { ok: true, prazo: toApiDateTime(draft.date, draft.time || END_OF_DAY) };
}
