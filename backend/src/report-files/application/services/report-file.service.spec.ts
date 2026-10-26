import { Logger } from '@nestjs/common';
import { InvalidRequestError } from '@/shared/errors/application.error';
import { ReportFileFormat } from '../../domain/report-document';
import type { ReportRenderer } from '../../domain/services/report-renderer';
import { buildReportDocument } from '../../testing/report-document-fixtures';
import { ReportGenerationError } from '../errors/report-generation.error';
import { INVALID_REPORT_FORMAT_MESSAGE, ReportFileService } from './report-file.service';

describe('ReportFileService', () => {
  const pdfRenderer = { render: jest.fn<Promise<Buffer>, Parameters<ReportRenderer['render']>>() };
  const xlsxRenderer = { render: jest.fn<Promise<Buffer>, Parameters<ReportRenderer['render']>>() };
  const service = new ReportFileService(pdfRenderer, xlsxRenderer);

  beforeEach(() => {
    jest.resetAllMocks();
    pdfRenderer.render.mockResolvedValue(Buffer.from('%PDF-1.7'));
    xlsxRenderer.render.mockResolvedValue(Buffer.from('PK'));
  });

  it('renders a PDF and describes it for the download', async () => {
    const document = buildReportDocument({
      format: ReportFileFormat.PDF,
      fileName: 'Notas sessão',
    });

    const file = await service.generate(document);

    expect(pdfRenderer.render).toHaveBeenCalledWith(document);
    expect(xlsxRenderer.render).not.toHaveBeenCalled();
    expect(file).toEqual({
      content: Buffer.from('%PDF-1.7'),
      fileName: 'Notas-sessão.pdf',
      contentType: 'application/pdf',
    });
  });

  it('renders a spreadsheet and describes it for the download', async () => {
    const document = buildReportDocument({ format: ReportFileFormat.XLSX, fileName: 'turma' });

    const file = await service.generate(document);

    expect(xlsxRenderer.render).toHaveBeenCalledWith(document);
    expect(file.fileName).toBe('turma.xlsx');
    expect(file.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('rejects an unknown format without rendering anything', async () => {
    const document = buildReportDocument({ format: 'DOCX' as ReportFileFormat });

    const generation = service.generate(document);

    await expect(generation).rejects.toBeInstanceOf(InvalidRequestError);
    await expect(generation).rejects.toThrow(INVALID_REPORT_FORMAT_MESSAGE);
    expect(pdfRenderer.render).not.toHaveBeenCalled();
    expect(xlsxRenderer.render).not.toHaveBeenCalled();
  });

  it('turns a rendering failure into a generation error instead of a partial file', async () => {
    const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const failure = new Error('font not found');
    pdfRenderer.render.mockRejectedValue(failure);

    const generation = service.generate(buildReportDocument());

    await expect(generation).rejects.toBeInstanceOf(ReportGenerationError);
    await expect(generation).rejects.toMatchObject({ cause: failure });
    expect(logError).toHaveBeenCalledWith('Report "Relatório" failed to render', failure.stack);
    logError.mockRestore();
  });

  it('refuses to deliver an empty file', async () => {
    xlsxRenderer.render.mockResolvedValue(Buffer.alloc(0));

    await expect(
      service.generate(buildReportDocument({ format: ReportFileFormat.XLSX })),
    ).rejects.toBeInstanceOf(ReportGenerationError);
  });
});
