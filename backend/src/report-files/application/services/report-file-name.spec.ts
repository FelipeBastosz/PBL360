import { toReportBaseName } from './report-file-name';

describe('toReportBaseName', () => {
  it('keeps accents and joins words with hyphens', () => {
    expect(toReportBaseName('Relatório da sessão  Abertura')).toBe('Relatório-da-sessão-Abertura');
  });

  it('removes path separators and characters forbidden in file names', () => {
    expect(toReportBaseName('../turma:A/"final"*?<>|')).toBe('turmaAfinal');
  });

  it('removes control characters that could break the download header', () => {
    expect(toReportBaseName('relatorio\r\nSet-Cookie')).toBe('relatorio-Set-Cookie');
  });

  it('falls back to a default name when nothing usable is left', () => {
    expect(toReportBaseName('  ///  ')).toBe('relatorio');
  });

  it('limits the length of the name', () => {
    expect(toReportBaseName('a'.repeat(500))).toHaveLength(120);
  });
});
