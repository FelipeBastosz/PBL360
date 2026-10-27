import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, sep } from 'node:path';
import { Injectable } from '@nestjs/common';
import type * as PdfMake from 'pdfmake';
import type { ReportDocument } from '../../domain/report-document';
import type { ReportRenderer } from '../../domain/services/report-renderer';
import { PDF_FONT, buildPdfDefinition } from './pdf-document-definition';

const pdfmake = createRequire(__filename)('pdfmake') as typeof PdfMake;
const LOGO_PATH = join(__dirname, 'assets', 'pbl360-logo.svg');
const FONT_DIRECTORY = join(dirname(require.resolve('pdfmake/package.json')), 'fonts', 'Roboto');

const configurePdfmake = (): void => {
  pdfmake.setFonts({
    [PDF_FONT]: {
      normal: join(FONT_DIRECTORY, 'Roboto-Regular.ttf'),
      bold: join(FONT_DIRECTORY, 'Roboto-Medium.ttf'),
      italics: join(FONT_DIRECTORY, 'Roboto-Italic.ttf'),
      bolditalics: join(FONT_DIRECTORY, 'Roboto-MediumItalic.ttf'),
    },
  });
  pdfmake.setUrlAccessPolicy(() => false);
  pdfmake.setLocalAccessPolicy((path) => path.startsWith(`${FONT_DIRECTORY}${sep}`));
};

@Injectable()
export class PdfmakeReportRenderer implements ReportRenderer {
  private readonly logoSvg = readFileSync(LOGO_PATH, 'utf8');

  constructor() {
    configurePdfmake();
  }

  async render(document: ReportDocument): Promise<Buffer> {
    return pdfmake.createPdf(buildPdfDefinition(document, this.logoSvg)).getBuffer();
  }
}
