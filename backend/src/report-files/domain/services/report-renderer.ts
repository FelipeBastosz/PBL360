import type { ReportDocument } from '../report-document';

export interface ReportRenderer {
  render(document: ReportDocument): Promise<Buffer>;
}

export const PDF_REPORT_RENDERER = Symbol('PdfReportRenderer');

export const XLSX_REPORT_RENDERER = Symbol('XlsxReportRenderer');
