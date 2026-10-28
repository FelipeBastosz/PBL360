import { ReportFileFormat, type ReportFile } from '@/report-files/domain/report-document';
import { ReportGenerationError } from '@/report-files/application/errors/report-generation.error';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { ExportSessionReportUseCase } from '../../application/use-cases/export-session-report.use-case';
import { SessionReportController } from './session-report.controller';

describe('SessionReportController', () => {
  let controller: SessionReportController;
  let exportUseCase: jest.Mocked<ExportSessionReportUseCase>;

  const pdfFile: ReportFile = {
    content: Buffer.from('%PDF-1.7 sample content'),
    fileName: 'relatorio-sessao-1.pdf',
    contentType: 'application/pdf',
  };

  const xlsxFile: ReportFile = {
    content: Buffer.from('PK sample content'),
    fileName: 'relatorio-sessao-1.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  beforeEach(() => {
    exportUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ExportSessionReportUseCase>;

    controller = new SessionReportController(exportUseCase);
  });

  it('exports session report as PDF streamable file', async () => {
    exportUseCase.execute.mockResolvedValue(pdfFile);

    const result = await controller.export('sess-1', { formato: ReportFileFormat.PDF }, 'tutor-1');

    expect(exportUseCase.execute).toHaveBeenCalledWith({
      sessionId: 'sess-1',
      format: ReportFileFormat.PDF,
      tutorId: 'tutor-1',
    });

    const headers = result.getHeaders();
    expect(headers.type).toBe('application/pdf');
    expect(headers.length).toBe(pdfFile.content.length);
    expect(headers.disposition).toContain('filename="relatorio-sessao-1.pdf"');
  });

  it('exports session report as XLSX streamable file', async () => {
    exportUseCase.execute.mockResolvedValue(xlsxFile);

    const result = await controller.export('sess-1', { formato: ReportFileFormat.XLSX }, 'tutor-1');

    expect(exportUseCase.execute).toHaveBeenCalledWith({
      sessionId: 'sess-1',
      format: ReportFileFormat.XLSX,
      tutorId: 'tutor-1',
    });

    const headers = result.getHeaders();
    expect(headers.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(headers.length).toBe(xlsxFile.content.length);
    expect(headers.disposition).toContain('filename="relatorio-sessao-1.xlsx"');
  });

  it('propagates ReportGenerationError so ReportGenerationFilter can handle it', async () => {
    exportUseCase.execute.mockRejectedValue(new ReportGenerationError());

    await expect(
      controller.export('sess-1', { formato: ReportFileFormat.PDF }, 'tutor-1'),
    ).rejects.toBeInstanceOf(ReportGenerationError);
  });

  it('propagates ForbiddenError when tutor has no access', async () => {
    exportUseCase.execute.mockRejectedValue(
      new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
    );

    await expect(
      controller.export('sess-1', { formato: ReportFileFormat.PDF }, 'unauthorized-tutor'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('propagates NotFoundError when session does not exist', async () => {
    exportUseCase.execute.mockRejectedValue(new NotFoundError('Sessão não encontrada.'));

    await expect(
      controller.export('nonexistent', { formato: ReportFileFormat.PDF }, 'tutor-1'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
