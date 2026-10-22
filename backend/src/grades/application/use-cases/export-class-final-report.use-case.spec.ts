import { ReportFileFormat, type ReportFile } from '@/report-files/domain/report-document';
import type { ReportFileGenerator } from '@/report-files/domain/services/report-file-generator';
import { ReportGenerationError } from '@/report-files/application/errors/report-generation.error';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { buildClassFinalReportFixture } from '../../testing/class-final-report.fixture';
import { GetClassFinalReportUseCase } from './get-class-final-report.use-case';
import { ExportClassFinalReportUseCase } from './export-class-final-report.use-case';

describe('ExportClassFinalReportUseCase', () => {
  const getReport = Object.assign(
    Object.create(GetClassFinalReportUseCase.prototype) as GetClassFinalReportUseCase,
    { execute: jest.fn() },
  );
  const generator: jest.Mocked<ReportFileGenerator> = { generate: jest.fn() };
  const useCase = new ExportClassFinalReportUseCase(getReport, generator);
  const input = { roomId: 'room-1', tutorId: 'tutor-1', format: ReportFileFormat.PDF };
  const file: ReportFile = {
    content: Buffer.from('file'),
    contentType: 'application/pdf',
    fileName: 'turma.pdf',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getReport.execute.mockResolvedValue(buildClassFinalReportFixture());
    generator.generate.mockResolvedValue(file);
  });

  it.each([ReportFileFormat.PDF, ReportFileFormat.XLSX])(
    'exports %s through the same authorized consolidation',
    async (format) => {
      const result = await useCase.execute({ ...input, format });
      expect(getReport.execute).toHaveBeenCalledTimes(1);
      expect(getReport.execute).toHaveBeenCalledWith({ roomId: 'room-1', tutorId: 'tutor-1' });
      expect(generator.generate).toHaveBeenCalledWith(
        expect.objectContaining({ format, title: 'Relatório final da turma' }),
      );
      expect(result).toBe(file);
    },
  );

  it.each([new ForbiddenError('Sem acesso.'), new NotFoundError('Sala não encontrada.')])(
    'does not render files when consolidation denies access: %s',
    async (error) => {
      getReport.execute.mockRejectedValue(error);
      await expect(useCase.execute(input)).rejects.toBe(error);
      expect(generator.generate).not.toHaveBeenCalled();
    },
  );

  it('propagates file generation failure', async () => {
    const error = new ReportGenerationError();
    generator.generate.mockRejectedValue(error);
    await expect(useCase.execute(input)).rejects.toBe(error);
  });
});
