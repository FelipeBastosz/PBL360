import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './formatRelativeTime';

const now = new Date('2026-10-05T15:00:00Z');
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

describe('formatRelativeTime', () => {
  it('describes recent moments in minutes and hours', () => {
    expect(formatRelativeTime(ago(20_000), now)).toBe('Agora');
    expect(formatRelativeTime(ago(60_000), now)).toBe('Há 1 minuto');
    expect(formatRelativeTime(ago(2 * 3_600_000), now)).toBe('Há 2 horas');
  });

  it('says yesterday and then counts days for the last week', () => {
    expect(formatRelativeTime(ago(30 * 3_600_000), now)).toBe('Ontem');
    expect(formatRelativeTime(ago(3 * 86_400_000), now)).toBe('Há 3 dias');
  });

  it('shows the date for anything older than a week', () => {
    expect(formatRelativeTime('2026-09-01T12:00:00Z', now)).toBe('01/09/2026');
  });
});
