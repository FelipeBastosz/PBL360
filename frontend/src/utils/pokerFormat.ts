import { formatGrade, roundGrade } from './formatGrade';

export const roundToTenths = roundGrade;

export const formatPokerGrade = formatGrade;

export function formatPokerVote(value: number): string {
  return formatGrade(value);
}

export function parsePokerGrade(raw: string): number | null {
  const value = Number.parseFloat(raw.replace(',', '.'));
  if (Number.isNaN(value)) return null;
  return roundToTenths(Math.min(10, Math.max(0, value)));
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function joinNames(names: string[]): string {
  if (names.length < 2) return names.join('');
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}
