export function readStringFields<K extends string>(
  state: unknown,
  keys: readonly K[],
): Record<K, string> | null {
  if (typeof state !== 'object' || state === null) return null;
  const record = state as Record<string, unknown>;
  const hasAll = keys.every((key) => typeof record[key] === 'string' && record[key] !== '');
  return hasAll ? (record as Record<K, string>) : null;
}

// Problem a performance table is being applied to. The problem page sends it through the
// formulas list to the table detail, where "Aplicar fórmula" links the table to the problem.
export type ApplyTarget = { roomId: string; problemId: string };

export const readApplyTarget = (state: unknown): ApplyTarget | null =>
  readStringFields(state, ['roomId', 'problemId'] as const);
