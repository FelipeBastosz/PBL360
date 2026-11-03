export const DEFAULT_GRADE_DECIMALS = 1;

/**
 * Rounds a numeric value to a specified number of decimal places,
 * defending against JavaScript floating point precision issues (e.g. 0.1 + 0.2, 1.005).
 * Non-finite numbers, null, and undefined are safely converted to null.
 */
export function roundToDecimals(
  value: number | null | undefined,
  decimals = DEFAULT_GRADE_DECIMALS,
): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  const factor = 10 ** decimals;
  const epsilon = value >= 0 ? Number.EPSILON : -Number.EPSILON;
  const rounded = Math.round((value + epsilon) * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * Rounds a grade to 1 decimal place using standardized precision.
 */
export function roundGrade(value: number | null | undefined): number | null {
  return roundToDecimals(value, DEFAULT_GRADE_DECIMALS);
}
