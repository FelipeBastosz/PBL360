import type { Content, CustomTableLayout, Size, TableCell } from 'pdfmake/interfaces';
import {
  ReportColumnType,
  type ReportCellValue,
  type ReportColumn,
  type ReportSection,
  type ReportTableSection,
  type ReportTextSection,
} from '../../domain/report-document';
import {
  EMPTY_TABLE_MESSAGE,
  EMPTY_TEXT_SECTION_MESSAGE,
  MISSING_TEXT_LABEL,
  columnDecimals,
  formatCellText,
  normalizeCell,
} from '../report-cell';

export const SECTION_HEADLINE_LEVEL = 1;
export const SHORT_TEXT_LENGTH = 16;

const HEADER_FILL = '#E9EEF3';
const STRIPE_FILL = '#F7F9FB';
const LINE_COLOR = '#C5CED8';

export const TABLE_LAYOUT: CustomTableLayout = {
  fillColor: (rowIndex) => {
    if (rowIndex === 0) return HEADER_FILL;
    return rowIndex % 2 === 0 ? STRIPE_FILL : null;
  },
  hLineWidth: () => 0.5,
  vLineWidth: () => 0,
  hLineColor: () => LINE_COLOR,
  paddingTop: () => 3,
  paddingBottom: () => 3,
};

const ZERO_WIDTH_SPACE = '\u200B';
const LONG_WORD = /\S{25,}/gu;
const WORD_CHUNK = /(\S{20})(?=\S)/gu;

export const breakLongWords = (text: string): string =>
  text.replace(LONG_WORD, (word) => word.replace(WORD_CHUNK, `$1${ZERO_WIDTH_SPACE}`));

export const messageContent = (message: string): Content => ({ text: message, style: 'message' });

const alignmentFor = (column: ReportColumn) =>
  column.type === ReportColumnType.NUMBER ? 'right' : 'left';

const dataCell = (column: ReportColumn, raw: ReportCellValue | undefined): TableCell => {
  const value = normalizeCell(raw, column.type);
  return {
    text: breakLongWords(formatCellText(value, columnDecimals(column))),
    alignment: alignmentFor(column),
    style: value === null ? 'missing' : undefined,
  };
};

const headerCell = (column: ReportColumn): TableCell => ({
  text: breakLongWords(column.header),
  style: 'tableHeader',
  alignment: alignmentFor(column),
});

const columnWidth = ({ rows }: ReportTableSection, column: ReportColumn, index: number): Size => {
  if (column.type === ReportColumnType.NUMBER) return 'auto';
  const lengths = rows.map((row) => formatCellText(normalizeCell(row[index], column.type)).length);
  const isShort = Math.max(column.header.length, ...lengths) <= SHORT_TEXT_LENGTH;
  return isShort ? 'auto' : '*';
};

const tableWidths = (section: ReportTableSection): Size[] => {
  const widths = section.columns.map((column, index) => columnWidth(section, column, index));
  if (widths.includes('*')) return widths;
  const firstText = section.columns.findIndex((column) => column.type === ReportColumnType.TEXT);
  return widths.map((width, index) => (index === firstText ? '*' : width));
};

const tableContent = (section: ReportTableSection): Content => {
  const { columns, rows } = section;
  if (rows.length === 0) return messageContent(EMPTY_TABLE_MESSAGE);
  return {
    table: {
      headerRows: 1,
      dontBreakRows: false,
      widths: tableWidths(section),
      body: [
        columns.map(headerCell),
        ...rows.map((row) => columns.map((c, i) => dataCell(c, row[i]))),
      ],
    },
    layout: TABLE_LAYOUT,
  };
};

const textContent = ({ entries }: ReportTextSection): Content => {
  if (entries.length === 0) return messageContent(EMPTY_TEXT_SECTION_MESSAGE);
  return entries.map(({ label, text }) => ({
    stack: [
      { text: label, style: 'entryLabel' },
      text === null ? { text: MISSING_TEXT_LABEL, style: 'missing' } : { text },
    ],
    margin: [0, 0, 0, 8],
  }));
};

export const sectionContent = (section: ReportSection): Content[] => [
  { text: section.title, style: 'sectionTitle', headlineLevel: SECTION_HEADLINE_LEVEL },
  section.kind === 'table' ? tableContent(section) : textContent(section),
];
