import { extname } from 'node:path';
import { StreamableFile } from '@nestjs/common';
import { contentDisposition } from '@/shared/http/content-disposition';
import type { ReportFile } from '../../domain/report-document';

export const toReportFileResponse = (file: ReportFile): StreamableFile =>
  new StreamableFile(file.content, {
    type: file.contentType,
    length: file.content.length,
    disposition: contentDisposition(file.fileName, `relatorio${extname(file.fileName)}`),
  });
