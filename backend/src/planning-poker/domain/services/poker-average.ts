export const roundToCents = (value: number): number => Math.round(value * 100) / 100;

export function pokerAverage(scores: number[]): number | null {
  if (scores.length === 0) return null;
  return roundToCents(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}
