import { useEffect } from 'react';
import { MAX_TIMEOUT_MS, isSessionExpired, msUntilExpiry } from '@/utils/session';

export function useExpiryTimer(expiresAt: string | undefined, onExpire: () => void) {
  useEffect(() => {
    if (!expiresAt) return;
    const delay = Math.min(msUntilExpiry(expiresAt), MAX_TIMEOUT_MS);
    const id = window.setTimeout(() => {
      if (isSessionExpired(expiresAt)) onExpire();
    }, delay);
    return () => window.clearTimeout(id);
  }, [expiresAt, onExpire]);
}
