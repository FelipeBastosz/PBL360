import { Inject, Injectable, Logger } from '@nestjs/common';
import { InvalidRequestError } from '@/shared/errors/application.error';
import {
  ReportFileFormat,
  type ReportDocument,
  type ReportFile,
} from '../../domain/report-document';
import type { ReportFileGenerator } from '../../domain/services/report-file-generator';
import {
  PDF_REPORT_RENDERER,
  XLSX_REPORT_RENDERER,
  type ReportRenderer,
} from '../../domain/services/report-renderer';
import { ReportGenerationError } from '../errors/report-generation.error';
import { toReportBaseName } from './report-file-name';

interface ReportFileType {
  extension: string;
  contentType: string;
  renderer: ReportRenderer;
}

export const INVALID_REPORT_FORMAT_MESSAGE = 'O formato do relatório deve ser PDF ou XLSX.';

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Injectable()
export class ReportFileService implements ReportFileGenerator {
  private readonly logger = new Logger(ReportFileService.name);
  private readonly fileTypes: ReadonlyMap<string, ReportFileType>;

  constructor(
    @Inject(PDF_REPORT_RENDERER) pdfRenderer: ReportRenderer,
    @Inject(XLSX_REPORT_RENDERER) xlsxRenderer: ReportRenderer,
  ) {
    this.fileTypes = new Map([
      [
        ReportFileFormat.PDF,
        { extension: 'pdf', contentType: 'application/pdf', renderer: pdfRenderer },
      ],
      [
        ReportFileFormat.XLSX,
        { extension: 'xlsx', contentType: XLSX_CONTENT_TYPE, renderer: xlsxRenderer },
      ],
    ]);
  }

  async generate(document: ReportDocument): Promise<ReportFile> {
    const fileType = this.fileTypes.get(document.format);
    if (!fileType) throw new InvalidRequestError(INVALID_REPORT_FORMAT_MESSAGE);

    const content = await this.render(fileType.renderer, document);
    return {
      content,
      fileName: `${toReportBaseName(document.fileName)}.${fileType.extension}`,
      contentType: fileType.contentType,
    };
  }

  private async render(renderer: ReportRenderer, document: ReportDocument): Promise<Buffer> {
    let content: Buffer;
    try {
      content = await renderer.render(document);
    } catch (error) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.error(`Report "${document.title}" failed to render`, trace);
      throw new ReportGenerationError(error);
    }
    if (content.length === 0) throw new ReportGenerationError();
    return content;
  }
}
