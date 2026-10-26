import { Module } from '@nestjs/common';
import { ReportFileService } from './application/services/report-file.service';
import { REPORT_FILE_GENERATOR } from './domain/services/report-file-generator';
import { PDF_REPORT_RENDERER, XLSX_REPORT_RENDERER } from './domain/services/report-renderer';
import { PdfmakeReportRenderer } from './infrastructure/pdf/pdfmake-report-renderer';
import { ExceljsReportRenderer } from './infrastructure/xlsx/exceljs-report-renderer';

@Module({
  providers: [
    { provide: PDF_REPORT_RENDERER, useClass: PdfmakeReportRenderer },
    { provide: XLSX_REPORT_RENDERER, useClass: ExceljsReportRenderer },
    { provide: REPORT_FILE_GENERATOR, useClass: ReportFileService },
  ],
  exports: [REPORT_FILE_GENERATOR],
})
export class ReportFilesModule {}
