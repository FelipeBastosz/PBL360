import { contentDisposition } from './content-disposition';

describe('contentDisposition', () => {
  it('sends an ASCII name and the original UTF-8 name', () => {
    expect(contentDisposition('relatório "final".pdf')).toBe(
      'attachment; filename="relatorio final.pdf"; ' +
        "filename*=UTF-8''relat%C3%B3rio%20%22final%22.pdf",
    );
  });

  it('uses the fallback name when only the extension survives', () => {
    expect(contentDisposition('отчёт.xlsx', 'relatorio.xlsx')).toMatch(
      /^attachment; filename="relatorio\.xlsx";/,
    );
    expect(contentDisposition('文件.pdf')).toMatch(/^attachment; filename="documento\.pdf";/);
  });
});
