import type { UserPreferences } from '@/types/preferences';
import { normalizeUserPreferences } from '@/utils/themePalette';

const STORAGE_KEY = 'pbl360.preferences';

type StoredPreferences = UserPreferences & {
  userId: string;
};

function parseStored(raw: string | null): StoredPreferences | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const candidate = parsed as Partial<StoredPreferences>;
    if (typeof candidate.userId !== 'string' || !candidate.userId) return null;
    const normalized = normalizeUserPreferences(candidate);
    return { userId: candidate.userId, ...normalized };
  } catch {
    return null;
  }
}

export const preferencesStore = {
  read(userId: string): UserPreferences | null {
    try {
      const stored = parseStored(localStorage.getItem(STORAGE_KEY));
      if (!stored || stored.userId !== userId) return null;
      return { tema: stored.tema, cor: stored.cor };
    } catch {
      return null;
    }
  },

  save(userId: string, preferences: UserPreferences): void {
    try {
      const payload: StoredPreferences = {
        userId,
        ...normalizeUserPreferences(preferences),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota or private-mode failures.
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  },
};
