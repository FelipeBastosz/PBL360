const STORAGE_KEY = 'pbl360_apply_target';

export function readStringFields<K extends string>(
  state: unknown,
  keys: readonly K[],
): Record<K, string> | null {
  if (typeof state !== 'object' || state === null) return null;
  const record = state as Record<string, unknown>;
  const hasAll = keys.every((key) => typeof record[key] === 'string' && record[key] !== '');
  return hasAll ? (record as Record<K, string>) : null;
}

export type ApplyTarget = {
  sessionId: string;
  roomId?: string;
  problemId?: string;
};

export function readApplyTarget(state: unknown): ApplyTarget | null {
  if (typeof state === 'object' && state !== null) {
    const record = state as Record<string, unknown>;
    if (typeof record.sessionId === 'string' && record.sessionId.trim() !== '') {
      const target: ApplyTarget = {
        sessionId: record.sessionId,
        roomId: typeof record.roomId === 'string' ? record.roomId : '',
        problemId: typeof record.problemId === 'string' ? record.problemId : '',
      };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(target));
      } catch {
        // ignore
      }
      return target;
    }
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ApplyTarget;
      if (parsed && typeof parsed.sessionId === 'string' && parsed.sessionId.trim() !== '') {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export function clearApplyTarget(): void {}
