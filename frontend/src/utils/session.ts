export const MAX_TIMEOUT_MS = 2_147_483_647;

export function msUntilExpiry(expiresAt: string, now: number = Date.now()): number {
  const expiry = Date.parse(expiresAt);
  if (Number.isNaN(expiry)) return 0;
  return Math.max(0, expiry - now);
}

export function isSessionExpired(expiresAt: string, now: number = Date.now()): boolean {
  return msUntilExpiry(expiresAt, now) === 0;
}
