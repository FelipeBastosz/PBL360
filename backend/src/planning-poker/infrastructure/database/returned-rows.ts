export function returnedRows<T>(result: T[] | [T[], number]): T[] {
  const [first] = result;
  return Array.isArray(first) ? first : (result as T[]);
}
