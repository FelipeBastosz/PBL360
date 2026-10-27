import { Test } from '@nestjs/testing';
import { ReportFileFormat } from './domain/report-document';
import {
  REPORT_FILE_GENERATOR,
  type ReportFileGenerator,
} from './domain/services/report-file-generator';
import {
  classReportDocument,
  problemReportDocument,
  sessionReportDocument,
} from './testing/report-document-fixtures';
import { ReportFilesModule } from './report-files.module';

describe('ReportFilesModule', () => {
  let generator: ReportFileGenerator;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ReportFilesModule] }).compile();
    generator = moduleRef.get<ReportFileGenerator>(REPORT_FILE_GENERATOR);
  });

  it.each([
    [sessionReportDocument, 'relatório-sessão-abertura'],
    [problemReportDocument, 'relatorio-problema-1'],
    [classReportDocument, 'relatorio-final-turma-a'],
  ])('exports a PDF and a spreadsheet for each report', async (buildDocument, baseName) => {
    const pdf = await generator.generate(buildDocument(ReportFileFormat.PDF));
    const xlsx = await generator.generate(buildDocument(ReportFileFormat.XLSX));

    expect(pdf.fileName).toBe(`${baseName}.pdf`);
    expect(pdf.content.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(xlsx.fileName).toBe(`${baseName}.xlsx`);
    expect(xlsx.content.subarray(0, 2).toString('latin1')).toBe('PK');
  });
});
