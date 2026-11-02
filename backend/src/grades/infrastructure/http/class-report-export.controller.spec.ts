import { StreamableFile } from '@nestjs/common';
import { ReportFileFormat, type ReportFile } from '@/report-files/domain/report-document';
import { ClassReportExportController } from './class-report-export.controller';
import type { ExportClassFinalReportUseCase } from '../../application/use-cases/export-class-final-report.use-case';

describe('ClassReportExportController', () => {
  let controller: ClassReportExportController;
  let useCase: jest.Mocked<Pick<ExportClassFinalReportUseCase, 'execute'>>;

  const mockFile: ReportFile = {
    content: Buffer.from('PDF content'),
    fileName: 'relatorio-final.pdf',
    contentType: 'application/pdf',
  };

  beforeEach(() => {
    useCase = {
      execute: jest.fn().mockResolvedValue(mockFile),
    };
    controller = new ClassReportExportController(
      useCase as unknown as ExportClassFinalReportUseCase,
    );
  });

  it('delegates report export to use case and returns streamable file response', async () => {
    const response = await controller.get('room-1', 'tutor-1', { formato: ReportFileFormat.PDF });

    expect(useCase.execute).toHaveBeenCalledWith({
      roomId: 'room-1',
      tutorId: 'tutor-1',
      format: ReportFileFormat.PDF,
      ocultarNomes: undefined,
    });
    expect(response).toBeInstanceOf(StreamableFile);
  });

  it('delegates report export with ocultarNomes: true', async () => {
    const response = await controller.get('room-1', 'tutor-1', {
      formato: ReportFileFormat.XLSX,
      ocultarNomes: true,
    });

    expect(useCase.execute).toHaveBeenCalledWith({
      roomId: 'room-1',
      tutorId: 'tutor-1',
      format: ReportFileFormat.XLSX,
      ocultarNomes: true,
    });
    expect(response).toBeInstanceOf(StreamableFile);
  });
});
