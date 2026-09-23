import { describe, expect, it } from 'vitest';
import { isSessionExpired, msUntilExpiry } from './session';

const NOW = Date.parse('2026-09-22T12:00:00.000Z');

describe('msUntilExpiry', () => {
  it('returns the milliseconds left until the expiry date', () => {
    expect(msUntilExpiry('2026-09-22T12:00:30.000Z', NOW)).toBe(30_000);
  });

  it('never returns a negative value', () => {
    expect(msUntilExpiry('2026-09-22T11:00:00.000Z', NOW)).toBe(0);
  });

  it('treats an unparseable date as already expired', () => {
    expect(msUntilExpiry('amanhã', NOW)).toBe(0);
  });
});

describe('isSessionExpired', () => {
  it('is false while the expiry date is in the future', () => {
    expect(isSessionExpired('2026-09-23T12:00:00.000Z', NOW)).toBe(false);
  });

  it('is true once the expiry date is reached', () => {
    expect(isSessionExpired('2026-09-22T12:00:00.000Z', NOW)).toBe(true);
  });
});
