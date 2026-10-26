import { Inject, Injectable } from '@nestjs/common';
import type { ReportFile, ReportFileFormat } from '@/report-files/domain/report-document';
import {
  REPORT_FILE_GENERATOR,
  type ReportFileGenerator,
} from '@/report-files/domain/services/report-file-generator';
import { SessionAccessService } from '../services/session-access.service';
import {
  SESSION_REPORT_REPOSITORY,
  type SessionReportRepository,
} from '../../domain/repositories/session-report.repository';
import { buildSessionReportDocument } from './helpers/session-report-document.helper';

export interface ExportSessionReportInput {
  sessionId: string;
  format: ReportFileFormat;
  tutorId: string;
}

@Injectable()
export class ExportSessionReportUseCase {
  constructor(
    private readonly sessionAccess: SessionAccessService,
    @Inject(SESSION_REPORT_REPOSITORY)
    private readonly reportRepository: SessionReportRepository,
    @Inject(REPORT_FILE_GENERATOR)
    private readonly reportGenerator: ReportFileGenerator,
  ) {}

  async execute(input: ExportSessionReportInput): Promise<ReportFile> {
    const { session, roomId } = await this.sessionAccess.assertTutorCanAccessSessionById(
      input.sessionId,
      input.tutorId,
    );

    const data = await this.reportRepository.getSessionReportData(session.id, roomId);
    const document = buildSessionReportDocument(input.format, data);

    return this.reportGenerator.generate(document);
  }
}
