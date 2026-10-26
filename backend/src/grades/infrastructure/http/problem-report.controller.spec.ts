import { StreamableFile } from '@nestjs/common';
import { ReportFileFormat, type ReportFile } from '@/report-files/domain/report-document';
import { ProblemReportController } from './problem-report.controller';
import type { ExportProblemReportUseCase } from '../../application/use-cases/export-problem-report.use-case';

describe('ProblemReportController', () => {
  let controller: ProblemReportController;
  let useCase: jest.Mocked<Pick<ExportProblemReportUseCase, 'execute'>>;

  const mockFile: ReportFile = {
    content: Buffer.from('PDF content'),
    fileName: 'relatorio-problema-1.pdf',
    contentType: 'application/pdf',
  };

  beforeEach(() => {
    useCase = {
      execute: jest.fn().mockResolvedValue(mockFile),
    };
    controller = new ProblemReportController(useCase as unknown as ExportProblemReportUseCase);
  });

  it('delegates report export to use case and returns streamable file response', async () => {
    const response = await controller.export(
      'room-1',
      'problem-1',
      { formato: ReportFileFormat.PDF },
      'tutor-1',
    );

    expect(useCase.execute).toHaveBeenCalledWith({
      roomId: 'room-1',
      problemId: 'problem-1',
      tutorId: 'tutor-1',
      format: ReportFileFormat.PDF,
      ocultarNomes: undefined,
    });
    expect(response).toBeInstanceOf(StreamableFile);
  });

  it('delegates report export with ocultarNomes: true', async () => {
    const response = await controller.export(
      'room-1',
      'problem-1',
      { formato: ReportFileFormat.PDF, ocultarNomes: true },
      'tutor-1',
    );

    expect(useCase.execute).toHaveBeenCalledWith({
      roomId: 'room-1',
      problemId: 'problem-1',
      tutorId: 'tutor-1',
      format: ReportFileFormat.PDF,
      ocultarNomes: true,
    });
    expect(response).toBeInstanceOf(StreamableFile);
  });
});
