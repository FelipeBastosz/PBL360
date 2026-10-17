import { toReportFileResponse } from './report-file-response';

describe('toReportFileResponse', () => {
  it('sends the file as a download with its type and size', () => {
    const content = Buffer.from('%PDF-1.7');

    const response = toReportFileResponse({
      content,
      fileName: 'relatório-sessão.pdf',
      contentType: 'application/pdf',
    });

    expect(response.getHeaders()).toEqual({
      type: 'application/pdf',
      length: content.length,
      disposition:
        'attachment; filename="relatorio-sessao.pdf"; ' +
        "filename*=UTF-8''relat%C3%B3rio-sess%C3%A3o.pdf",
    });
  });

  it('falls back to a report name with the right extension when nothing is ASCII', () => {
    const response = toReportFileResponse({
      content: Buffer.from('PK'),
      fileName: 'отчёт.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    expect(response.getHeaders().disposition).toMatch(/^attachment; filename="relatorio\.xlsx";/);
  });
});
