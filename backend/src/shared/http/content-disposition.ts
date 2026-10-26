export const contentDisposition = (fileName: string, fallbackName = 'documento.pdf'): string => {
  const ascii = fileName
    .normalize('NFD')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/["\\]/g, '');
  const hasName = ascii.replace(/\.[^.]*$/, '').trim() !== '';
  return `attachment; filename="${hasName ? ascii : fallbackName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
};
