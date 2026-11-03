const EMPTY_GRADE = '—';

// Number.EPSILON keeps values such as 8.25 or 1.05 from rounding down because of their
// binary representation.
export function roundGrade(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

// Every grade in the UI goes through here: one decimal place, Brazilian comma (8,5).
export function formatGrade(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EMPTY_GRADE;
  const rounded = roundGrade(value);
  return (Object.is(rounded, -0) ? 0 : rounded).toFixed(1).replace('.', ',');
}
