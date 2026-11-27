import type {
  Content,
  ContextPageSize,
  DynamicBackground,
  DynamicContent,
  Node,
  NodeQueries,
  TableCell,
} from 'pdfmake/interfaces';
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
import { BRAND_900, CARD, STRIPE } from '../report-palette';
import { buildPdfDefinition, keepSectionTitleWithContent } from './pdf-document-definition';
import { TEXT_CARD_LAYOUT } from './pdf-text-content';
import { breakLongWords } from './pdf-text-format';

const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path/></svg>';
const ISSUED_AT = new Date('2026-11-12T20:22:00Z');
const PORTRAIT: ContextPageSize = { width: 595.28, height: 841.89, orientation: 'portrait' };

type Table = {
  table: { widths: unknown[]; body: TableCell[][] };
  layout: { fillColor: (rowIndex: number) => string };
};

const definitionOf = (document = sessionReportDocument(ReportFileFormat.PDF)) =>
  buildPdfDefinition(document, LOGO, ISSUED_AT);

const contentOf = (definition: ReturnType<typeof buildPdfDefinition>): Content[] =>
  Array.isArray(definition.content) ? definition.content : [];

const tableAt = (content: Content[], index: number): Table => content[index] as unknown as Table;

const headerOf = (definition: ReturnType<typeof buildPdfDefinition>, page: number) =>
  (definition.header as DynamicContent)(page, 3, PORTRAIT);

const singleTable = (columns: { header: string; type: ReportColumnType }[], rows: unknown[][]) =>
  buildReportDocument({
    sections: [{ kind: 'table', title: 'Tabela', columns, rows: rows as never }],
  });

describe('buildPdfDefinition', () => {
  it('prints every report in portrait, even the wide ones', () => {
    for (const document of [
      sessionReportDocument(ReportFileFormat.PDF),
      problemReportDocument(ReportFileFormat.PDF),
      classReportDocument(ReportFileFormat.PDF),
    ]) {
      expect(definitionOf(document).pageOrientation).toBe('portrait');
    }
  });

  describe('letterhead', () => {
    const definition = definitionOf();

    it('opens the first page with the logo, the report title and when it was issued', () => {
      expect(headerOf(definition, 1)).toMatchObject({
        columns: [
          { svg: LOGO },
          {
            alignment: 'right',
            stack: [
              { text: 'Relatório da sessão', style: 'documentTitle' },
              { text: '12/11/2026 · 17:22', style: 'issuedAt' },
            ],
          },
        ],
      });
    });

    it('uses a compact header on the following pages', () => {
      expect(headerOf(definition, 2)).toMatchObject({
        columns: [
          { svg: LOGO },
          { stack: [{ text: 'Relatório da sessão · continuação', style: 'continuation' }] },
        ],
      });
    });

    it('repeats the identification in the compact header when the report asks for it', () => {
      const repeated = definitionOf(
        buildReportDocument({
          title: 'Relatório do problema',
          repeatIdentification: true,
          identification: [
            { label: 'Turma', value: 'Turma A' },
            { label: 'Semestre', value: '2026.2' },
          ],
        }),
      );

      expect(headerOf(repeated, 2)).toMatchObject({
        columns: [{}, { stack: [{}, { text: 'Turma A · 2026.2', style: 'issuedAt' }] }],
      });
    });

    it('signs every page in the footer with the issue date and the page number', () => {
      const footer = definition.footer as DynamicContent;

      expect(footer(2, 5, PORTRAIT)).toMatchObject({
        columns: [
          { text: 'PBL360 · Documento gerado automaticamente em 12/11/2026 17:22' },
          { text: 'Página 2 de 5', alignment: 'right' },
        ],
      });
    });

    it('draws the brand band and a faint watermark behind every page', () => {
      const background = (definition.background as DynamicBackground)(1, PORTRAIT) as Array<{
        svg: string;
        absolutePosition: { x: number; y: number };
      }>;

      expect(background[0]?.svg).toContain('linearGradient');
      expect(background[0]?.absolutePosition).toEqual({ x: 0, y: 0 });
      expect(background[1]?.svg).toContain('<g opacity="0.07"><path/></g></svg>');
    });
  });

  describe('session report body', () => {
    const content = contentOf(definitionOf());

    it('starts with the identification as labelled items', () => {
      expect(content[0]).toMatchObject({
        columns: [
          {
            stack: [
              { text: 'SALA', style: 'identificationLabel' },
              { text: 'Turma A — Medicina 2026.2', style: 'identificationValue' },
            ],
          },
          { stack: [{ text: 'PROBLEMA' }, {}] },
          { stack: [{ text: 'SESSÃO' }, {}] },
        ],
      });
    });

    it('keeps each section title with its content', () => {
      expect(content[1]).toEqual({
        text: 'Notas da sessão',
        style: 'sectionTitle',
        headlineLevel: 1,
      });
      expect(content[3]).toMatchObject({ text: 'Feedbacks da sessão', headlineLevel: 1 });
    });

    it('paints the header in the brand color and repeats it on every page', () => {
      const table = tableAt(content, 2);

      expect(table).toMatchObject({ table: { headerRows: 1, dontBreakRows: false } });
      expect(table.table.body[0]?.[0]).toMatchObject({ text: 'Aluno', style: 'tableHeader' });
      expect(table.layout.fillColor(0)).toBe(BRAND_900);
      expect([1, 2, 3].map((row) => table.layout.fillColor(row))).toEqual([CARD, STRIPE, CARD]);
    });

    it('highlights the student, colors the result by grade and marks missing values', () => {
      const [, first, second] = tableAt(content, 2).table.body;

      expect(first?.[0]).toMatchObject({ text: 'Ana Souza', style: 'rowLead' });
      expect(first?.[2]).toEqual({ text: '8,5', alignment: 'right' });
      expect(first?.[5]).toMatchObject({ text: '8,6', style: 'result', color: '#067647' });
      expect(second?.[0]).toMatchObject({ text: LONG_STUDENT_NAME });
      expect(second?.[3]).toEqual({
        text: MISSING_VALUE_LABEL,
        style: 'missing',
        alignment: 'right',
      });
    });

    it('shows each feedback as a card and marks the missing ones', () => {
      const cards = content[4] as unknown as Array<{ table: { body: TableCell[][] } }>;
      const stacks = cards.map((card) => (card.table.body[0]?.[0] as { stack: unknown }).stack);

      expect(cards[0]).toMatchObject({ layout: TEXT_CARD_LAYOUT, margin: [0, 0, 0, 6] });
      expect(stacks).toEqual([
        [{ text: 'Ana Souza', style: 'entryLabel' }, { text: 'Boa condução da discussão.' }],
        [{ text: LONG_STUDENT_NAME, style: 'entryLabel' }, { text: LONG_FEEDBACK }],
        [
          { text: '=SOMA(1;1)', style: 'entryLabel' },
          { text: MISSING_TEXT_LABEL, style: 'missing' },
        ],
      ]);
    });
  });

  it('hides a column that has no value in any row', () => {
    const document = singleTable(
      [
        { header: 'Aluno', type: ReportColumnType.TEXT },
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Nota', type: ReportColumnType.NUMBER },
      ],
      [
        [null, '001', 8],
        [null, '002', null],
      ],
    );
    const table = tableAt(contentOf(definitionOf(document)), 1);

    expect(
      table.table.body.map((row) => row.map((cell) => (cell as { text: string }).text)),
    ).toEqual([
      ['Matrícula', 'Nota'],
      ['001', '8,0'],
      ['002', MISSING_VALUE_LABEL],
    ]);
  });

  it('shows status values as colored text without a background', () => {
    const document = singleTable(
      [
        { header: 'Aluno', type: ReportColumnType.TEXT },
        { header: 'Situação', type: ReportColumnType.TEXT },
      ],
      [['Ana', 'Completa']],
    );
    const status = tableAt(contentOf(definitionOf(document)), 1).table.body[1]?.[1];

    expect(status).toEqual({
      text: 'Completa',
      style: 'status',
      color: '#067647',
      alignment: 'left',
    });
  });

  it('writes a repeated student once and stripes the table by student', () => {
    const document = singleTable(
      [
        { header: 'Aluno', type: ReportColumnType.TEXT },
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão pendente', type: ReportColumnType.TEXT },
      ],
      [
        ['Ana', '001', 'Abertura'],
        ['Ana', '001', 'Fechamento'],
        ['Bia', '002', 'Abertura'],
      ],
    );
    const table = tableAt(contentOf(definitionOf(document)), 1);

    expect(
      table.table.body.slice(1).map((row) => row.map((cell) => (cell as { text: string }).text)),
    ).toEqual([
      ['Ana', '001', 'Abertura'],
      ['', '', 'Fechamento'],
      ['Bia', '002', 'Abertura'],
    ]);
    expect([1, 2, 3].map((row) => table.layout.fillColor(row))).toEqual([CARD, CARD, STRIPE]);
  });

  it('stretches every column when the table has only numbers', () => {
    const document = singleTable(
      [
        { header: 'Tutor', type: ReportColumnType.NUMBER },
        { header: 'Pares', type: ReportColumnType.NUMBER },
      ],
      [[8, 9]],
    );

    expect(tableAt(contentOf(definitionOf(document)), 1).table.widths).toEqual(['*', '*']);
  });

  it('uses flexible identification columns when the combined values are long', () => {
    const document = buildReportDocument({
      identification: [{ label: 'Observação', value: 'a'.repeat(81) }],
    });

    expect(contentOf(definitionOf(document))[0]).toMatchObject({ columns: [{ width: '*' }] });
  });

  it('starts a report section on a new page when requested', () => {
    const document = buildReportDocument({
      sections: [
        {
          kind: 'table',
          title: 'Notas',
          startOnNewPage: true,
          columns: [{ header: 'Aluno', type: ReportColumnType.TEXT }],
          rows: [['Ana']],
        },
      ],
    });

    expect(contentOf(definitionOf(document))[0]).toMatchObject({ pageBreak: 'before' });
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

    expect(contentOf(definitionOf(emptySections))).toEqual([
      { text: 'Notas', style: 'sectionTitle', headlineLevel: 1 },
      { text: EMPTY_TABLE_MESSAGE, style: 'message' },
      { text: 'Feedbacks', style: 'sectionTitle', headlineLevel: 1 },
      { text: EMPTY_TEXT_SECTION_MESSAGE, style: 'message' },
    ]);
    expect(contentOf(definitionOf(buildReportDocument()))).toEqual([
      { text: EMPTY_DOCUMENT_MESSAGE, style: 'message' },
    ]);
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
    expect(broken.split(/\s|\u200B/).every((part: string) => part.length <= 20)).toBe(true);
  });

  it('leaves regular text untouched', () => {
    expect(breakLongWords('Maria Eduarda Albuquerque')).toBe('Maria Eduarda Albuquerque');
  });
});
