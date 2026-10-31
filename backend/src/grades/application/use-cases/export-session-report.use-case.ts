import { Inject, Injectable } from '@nestjs/common';
import type { ReportFile, ReportFileFormat } from '@/report-files/domain/report-document';
import {
  REPORT_FILE_GENERATOR,
  type ReportFileGenerator,
} from '@/report-files/domain/services/report-file-generator';
import type { Session } from '@/sessions/domain/entities/session.entity';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import {
  SESSION_REPORT_REPOSITORY,
  type SessionReportData,
  type SessionReportRepository,
} from '@/sessions/domain/repositories/session-report.repository';
import { GetProblemGradesUseCase } from './get-problem-grades.use-case';
import { buildSessionReportDocument } from './helpers/session-report-document.helper';
import {
  collectSessionGrades,
  type SessionReportGrades,
} from './helpers/session-report-grade.helper';

export interface ExportSessionReportInput {
  sessionId: string;
  format: ReportFileFormat;
  tutorId: string;
  ocultarNome?: boolean;
  mostrarFeedBack?: boolean;
  mostrarMarcacoes?: boolean;
}

@Injectable()
export class ExportSessionReportUseCase {
  constructor(
    private readonly sessionAccess: SessionAccessService,
    @Inject(SESSION_REPORT_REPOSITORY)
    private readonly reportRepository: SessionReportRepository,
    @Inject(REPORT_FILE_GENERATOR)
    private readonly reportGenerator: ReportFileGenerator,
    private readonly getProblemGrades: GetProblemGradesUseCase,
  ) {}

  async execute(input: ExportSessionReportInput): Promise<ReportFile> {
    const { session, roomId } = await this.sessionAccess.assertTutorCanAccessSessionById(
      input.sessionId,
      input.tutorId,
    );
    const [data, grades] = await this.loadReportData(session, roomId, input.tutorId);
    const document = buildSessionReportDocument(input.format, data, grades, {
      ocultarNome: input.ocultarNome,
      mostrarFeedBack: input.mostrarFeedBack,
      mostrarMarcacoes: input.mostrarMarcacoes,
    });

    return this.reportGenerator.generate(document);
  }

  private async loadReportData(
    session: Session,
    roomId: string,
    tutorId: string,
  ): Promise<[SessionReportData, SessionReportGrades]> {
    const [data, grades] = await Promise.all([
      this.reportRepository.getSessionReportData(session.id, roomId),
      this.getProblemGrades.executeWithSessionGrades({
        roomId,
        problemId: session.problemId,
        tutorId,
      }),
    ]);
    return [data, collectSessionGrades(grades, session.id)];
  }
}
