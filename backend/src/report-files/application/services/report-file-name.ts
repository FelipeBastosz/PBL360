const FALLBACK_BASE_NAME = 'relatorio';
const MAX_BASE_NAME_LENGTH = 120;

export const toReportBaseName = (fileName: string): string => {
  const baseName = fileName
    .normalize('NFC')
    .replace(/\p{Cc}/gu, ' ')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, MAX_BASE_NAME_LENGTH)
    .replace(/^[-.]+|[-.]+$/g, '');
  return baseName || FALLBACK_BASE_NAME;
};
