const MAX_SHEET_NAME_LENGTH = 31;

const sanitizeSheetName = (title: string): string =>
  title
    .replace(/[\p{Cc}[\]:*?/\\]/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s']+|[\s']+$/g, '');

const withSuffix = (baseName: string, attempt: number): string => {
  if (attempt === 1) return baseName.slice(0, MAX_SHEET_NAME_LENGTH);
  const suffix = ` (${attempt})`;
  return `${baseName.slice(0, MAX_SHEET_NAME_LENGTH - suffix.length).trimEnd()}${suffix}`;
};

export const createSheetNamer = (): ((title: string, position: number) => string) => {
  const usedNames = new Set<string>();
  return (title, position) => {
    const baseName = sanitizeSheetName(title) || `Seção ${position}`;
    let attempt = 1;
    while (usedNames.has(withSuffix(baseName, attempt).toLowerCase())) attempt += 1;
    const name = withSuffix(baseName, attempt);
    usedNames.add(name.toLowerCase());
    return name;
  };
};
