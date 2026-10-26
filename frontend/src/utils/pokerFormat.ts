export const roundToCents = (value: number): number => Math.round(value * 100) / 100;

export function formatPokerGrade(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toFixed(2).replace('.', ',');
}

export function formatPokerVote(value: number): string {
  return String(roundToCents(value)).replace('.', ',');
}

export function parsePokerGrade(raw: string): number | null {
  const value = Number.parseFloat(raw.replace(',', '.'));
  if (Number.isNaN(value)) return null;
  return roundToCents(Math.min(10, Math.max(0, value)));
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function joinNames(names: string[]): string {
  if (names.length < 2) return names.join('');
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}
