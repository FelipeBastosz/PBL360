import { ReportColumnType, ReportFileFormat } from '../../domain/report-document';
import {
  buildReportDocument,
  classReportDocument,
  problemReportDocument,
  sessionReportDocument,
} from '../../testing/report-document-fixtures';
import { PdfmakeReportRenderer } from './pdfmake-report-renderer';

const renderer = new PdfmakeReportRenderer();

const pageCount = (pdf: Buffer): number =>
  (pdf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length;

const expectCompletePdf = (pdf: Buffer): void => {
  expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  expect(pdf.subarray(-8).toString('latin1')).toContain('%%EOF');
};

describe('PdfmakeReportRenderer', () => {
  it.each([
    ['session', sessionReportDocument(ReportFileFormat.PDF)],
    ['problem', problemReportDocument(ReportFileFormat.PDF)],
    ['class', classReportDocument(ReportFileFormat.PDF)],
  ])('renders a complete PDF for the %s report', async (_name, document) => {
    expectCompletePdf(await renderer.render(document));
  });

  it('continues long feedback texts on the next page', async () => {
    const pdf = await renderer.render(sessionReportDocument(ReportFileFormat.PDF));

    expect(pageCount(pdf)).toBeGreaterThan(1);
  });

  it('spreads many rows across pages', async () => {
    const pdf = await renderer.render(classReportDocument(ReportFileFormat.PDF, 600));

    expectCompletePdf(pdf);
    expect(pageCount(pdf)).toBeGreaterThan(10);
  });

  it('renders a document without content as a single page', async () => {
    const pdf = await renderer.render(buildReportDocument());

    expectCompletePdf(pdf);
    expect(pageCount(pdf)).toBe(1);
  });

  it('renders long unbroken words and characters outside Latin', async () => {
    const pdf = await renderer.render(
      buildReportDocument({
        sections: [
          {
            kind: 'table',
            title: 'Notas',
            columns: [
              { header: 'Aluno', type: ReportColumnType.TEXT },
              { header: 'Nota', type: ReportColumnType.NUMBER },
            ],
            rows: [
              [`https://exemplo.uefs.br/${'a'.repeat(300)}`, 5],
              ['Zoë Ñúñez 😀 Ωμέγα', null],
            ],
          },
        ],
      }),
    );

    expectCompletePdf(pdf);
  });
});
