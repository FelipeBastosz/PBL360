export function readStringFields<K extends string>(
  state: unknown,
  keys: readonly K[],
): Record<K, string> | null {
  if (typeof state !== 'object' || state === null) return null;
  const record = state as Record<string, unknown>;
  const hasAll = keys.every((key) => typeof record[key] === 'string' && record[key] !== '');
  return hasAll ? (record as Record<K, string>) : null;
}
