import { Inject, Injectable } from '@nestjs/common';
import type { ReportFile, ReportFileFormat } from '@/report-files/domain/report-document';
import {
  REPORT_FILE_GENERATOR,
  type ReportFileGenerator,
} from '@/report-files/domain/services/report-file-generator';
import { buildClassFinalReportDocument } from '../services/class-final-report-document.builder';
import { GetClassFinalReportUseCase } from './get-class-final-report.use-case';

export interface ExportClassFinalReportInput {
  roomId: string;
  tutorId: string;
  format: ReportFileFormat;
}

@Injectable()
export class ExportClassFinalReportUseCase {
  constructor(
    private readonly getClassFinalReport: GetClassFinalReportUseCase,
    @Inject(REPORT_FILE_GENERATOR) private readonly reportFiles: ReportFileGenerator,
  ) {}

  async execute(input: ExportClassFinalReportInput): Promise<ReportFile> {
    const report = await this.getClassFinalReport.execute({
      roomId: input.roomId,
      tutorId: input.tutorId,
    });
    return this.reportFiles.generate(buildClassFinalReportDocument(report, input.format));
  }
}
