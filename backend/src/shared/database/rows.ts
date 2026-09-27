export const firstRowOrNull = <T>(rows: T[]): T | null => rows[0] ?? null;

export const requireFirstRow = <T>(rows: T[], message: string): T => {
  const [row] = rows;

  if (row === undefined) {
    throw new Error(message);
  }

  return row;
};
