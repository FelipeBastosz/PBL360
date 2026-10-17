import type { Content, DynamicContent, Node, NodeQueries } from 'pdfmake/interfaces';
import { ReportColumnType, ReportFileFormat } from '../../domain/report-document';
import {
  LONG_FEEDBACK,
  LONG_STUDENT_NAME,
  buildReportDocument,
  classReportDocument,
  problemReportDocument,
  sessionReportDocument,
} from '../../testing/report-document-fixtures';
import {
  EMPTY_DOCUMENT_MESSAGE,
  EMPTY_TABLE_MESSAGE,
  EMPTY_TEXT_SECTION_MESSAGE,
  MISSING_TEXT_LABEL,
  MISSING_VALUE_LABEL,
} from '../report-cell';
import {
  buildPdfDefinition,
  keepSectionTitleWithContent,
  pageOrientationFor,
} from './pdf-document-definition';
import { TABLE_LAYOUT, breakLongWords } from './pdf-section-content';

const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>';

const contentOf = (definition: ReturnType<typeof buildPdfDefinition>): Content[] =>
  Array.isArray(definition.content) ? definition.content : [];

describe('buildPdfDefinition', () => {
  describe('session report', () => {
    const definition = buildPdfDefinition(sessionReportDocument(ReportFileFormat.PDF), LOGO);
    const content = contentOf(definition);

    it('opens with the title and the identification of the report', () => {
      expect(content.slice(0, 4)).toEqual([
        { text: 'Relatório da sessão', style: 'title' },
        {
          text: [{ text: 'Sala: ', bold: true }, 'Turma A — Medicina 2026.2'],
          style: 'identification',
        },
        {
          text: [{ text: 'Problema: ', bold: true }, 'Problema 1 — Dor torácica'],
          style: 'identification',
        },
        {
          text: [{ text: 'Sessão: ', bold: true }, 'Abertura (14/10/2026)'],
          style: 'identification',
        },
      ]);
      expect(definition.info).toMatchObject({ title: 'Relatório da sessão', creator: 'PBL360' });
    });

    it('identifies each section with a heading kept with its content', () => {
      expect(content[4]).toEqual({
        text: 'Notas da sessão',
        style: 'sectionTitle',
        headlineLevel: 1,
      });
      expect(content[6]).toEqual({
        text: 'Feedbacks da sessão',
        style: 'sectionTitle',
        headlineLevel: 1,
      });
    });

    it('repeats the header on every page and lets long rows break across pages', () => {
      expect(content[5]).toMatchObject({
        table: {
          headerRows: 1,
          dontBreakRows: false,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
        },
        layout: TABLE_LAYOUT,
      });
    });

    it('formats grades, keeps registrations as typed and marks missing values', () => {
      expect(content[5]).toMatchObject({
        table: {
          body: [
            [
              { text: 'Aluno', style: 'tableHeader' },
              { text: 'Matrícula' },
              { text: 'Tutor', alignment: 'right' },
              {},
              {},
              {},
            ],
            [
              { text: 'Ana Souza' },
              { text: '00123' },
              { text: '8,50' },
              { text: '9,00' },
              { text: '8,75' },
              { text: '8,62' },
            ],
            [
              { text: LONG_STUDENT_NAME },
              { text: '04567' },
              { text: '7,00' },
              { text: MISSING_VALUE_LABEL, style: 'missing' },
              { text: '6,50' },
              { text: MISSING_VALUE_LABEL, style: 'missing' },
            ],
            [{ text: '=SOMA(1;1)' }, {}, {}, {}, {}, {}],
          ],
        },
      });
    });

    it('keeps the whole feedback text and marks the missing ones', () => {
      expect(content[7]).toEqual([
        {
          stack: [
            { text: 'Ana Souza', style: 'entryLabel' },
            { text: 'Boa condução da discussão.' },
          ],
          margin: [0, 0, 0, 8],
        },
        {
          stack: [{ text: LONG_STUDENT_NAME, style: 'entryLabel' }, { text: LONG_FEEDBACK }],
          margin: [0, 0, 0, 8],
        },
        {
          stack: [
            { text: '=SOMA(1;1)', style: 'entryLabel' },
            { text: MISSING_TEXT_LABEL, style: 'missing' },
          ],
          margin: [0, 0, 0, 8],
        },
      ]);
    });
  });

  it('uses portrait for narrow tables and landscape for wide ones', () => {
    expect(pageOrientationFor(sessionReportDocument(ReportFileFormat.PDF))).toBe('portrait');
    expect(pageOrientationFor(problemReportDocument(ReportFileFormat.PDF))).toBe('landscape');
    expect(
      buildPdfDefinition(problemReportDocument(ReportFileFormat.PDF), LOGO).pageOrientation,
    ).toBe('landscape');
  });

  it('stretches the first text column when every column is short', () => {
    const content = contentOf(
      buildPdfDefinition(classReportDocument(ReportFileFormat.PDF, 3), LOGO),
    );

    expect(content[3]).toMatchObject({
      table: { widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'] },
    });
  });

  it('stretches every column when the table has only numbers', () => {
    const document = buildReportDocument({
      sections: [
        {
          kind: 'table',
          title: 'Notas',
          columns: [
            { header: 'Tutor', type: ReportColumnType.NUMBER },
            { header: 'Pares', type: ReportColumnType.NUMBER },
          ],
          rows: [[8, 9]],
        },
      ],
    });

    expect(contentOf(buildPdfDefinition(document, LOGO))[2]).toMatchObject({
      table: { widths: ['*', '*'] },
    });
  });

  it('breaks long words in feedback labels and texts', () => {
    const url = `https://exemplo.uefs.br/${'a'.repeat(60)}`;
    const document = buildReportDocument({
      sections: [{ kind: 'text', title: 'Feedbacks', entries: [{ label: url, text: url }] }],
    });

    expect(contentOf(buildPdfDefinition(document, LOGO))[2]).toEqual([
      {
        stack: [{ text: breakLongWords(url), style: 'entryLabel' }, { text: breakLongWords(url) }],
        margin: [0, 0, 0, 8],
      },
    ]);
    expect(breakLongWords(url)).not.toBe(url);
  });

  it('uses the declared decimals for each column', () => {
    const content = contentOf(
      buildPdfDefinition(classReportDocument(ReportFileFormat.PDF, 3), LOGO),
    );

    const table = content[3] as { table: { body: Array<Array<{ text: string }>> } };

    expect(table.table.body[1]?.[3]?.text).toBe('7,50');
    expect(table.table.body[1]?.[5]?.text).toBe('0');
  });

  it('explains empty sections and empty documents', () => {
    const emptySections = buildReportDocument({
      sections: [
        {
          kind: 'table',
          title: 'Notas',
          columns: [{ header: 'Aluno', type: ReportColumnType.TEXT }],
          rows: [],
        },
        { kind: 'text', title: 'Feedbacks', entries: [] },
      ],
    });

    expect(contentOf(buildPdfDefinition(emptySections, LOGO))).toEqual([
      { text: 'Relatório', style: 'title' },
      { text: 'Notas', style: 'sectionTitle', headlineLevel: 1 },
      { text: EMPTY_TABLE_MESSAGE, style: 'message' },
      { text: 'Feedbacks', style: 'sectionTitle', headlineLevel: 1 },
      { text: EMPTY_TEXT_SECTION_MESSAGE, style: 'message' },
    ]);
    expect(contentOf(buildPdfDefinition(buildReportDocument(), LOGO))).toEqual([
      { text: 'Relatório', style: 'title' },
      { text: EMPTY_DOCUMENT_MESSAGE, style: 'message' },
    ]);
  });

  it('prints the logo and the page number in the footer of every page', () => {
    const footer = buildPdfDefinition(buildReportDocument(), LOGO).footer as DynamicContent;

    expect(footer(2, 5, { width: 595, height: 842, orientation: 'portrait' })).toMatchObject({
      columns: [{ svg: LOGO }, { text: 'Página 2 de 5', alignment: 'right' }],
    });
  });
});

describe('keepSectionTitleWithContent', () => {
  const queries = (following: number): NodeQueries => ({
    getFollowingNodesOnPage: () => Array.from({ length: following }, () => ({}) as Node),
    getNodesOnNextPage: () => [],
    getPreviousNodesOnPage: () => [],
  });

  it('moves a section title that would be alone at the bottom of a page', () => {
    expect(keepSectionTitleWithContent({ headlineLevel: 1 } as Node, queries(0))).toBe(true);
  });

  it('leaves titles followed by content and other nodes where they are', () => {
    expect(keepSectionTitleWithContent({ headlineLevel: 1 } as Node, queries(3))).toBe(false);
    expect(keepSectionTitleWithContent({} as Node, queries(0))).toBe(false);
  });
});

describe('breakLongWords', () => {
  it('adds invisible break points to long words so table cells are not cut', () => {
    const url = `https://exemplo.uefs.br/${'a'.repeat(60)}`;
    const broken = breakLongWords(url);

    expect(broken).toContain('\u200B');
    expect(broken.replaceAll('\u200B', '')).toBe(url);
    expect(broken.split(/\s|\u200B/).every((part) => part.length <= 20)).toBe(true);
  });

  it('leaves regular text untouched', () => {
    expect(breakLongWords('Maria Eduarda Albuquerque')).toBe('Maria Eduarda Albuquerque');
  });
});
