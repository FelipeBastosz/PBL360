import type { ReportDocument, ReportFile } from '../report-document';

export interface ReportFileGenerator {
  generate(document: ReportDocument): Promise<ReportFile>;
}

export const REPORT_FILE_GENERATOR = Symbol('ReportFileGenerator');
