import type { Content, CustomTableLayout, Size, TableCell } from 'pdfmake/interfaces';
import {
  ReportColumnType,
  type ReportCellValue,
  type ReportColumn,
  type ReportTableSection,
} from '../../domain/report-document';
import {
  EMPTY_TABLE_MESSAGE,
  MISSING_VALUE_LABEL,
  columnDecimals,
  formatCellText,
  normalizeCell,
} from '../report-cell';
import { BRAND_900, CARD, STRIPE, gradeTone, statusTone } from '../report-palette';
import { resultColumnIndex, withoutEmptyColumns } from '../report-table-view';
import { breakLongWords, messageContent } from './pdf-text-format';

export const SHORT_TEXT_LENGTH = 16;

const EDGE_PADDING = 12;
const COLUMN_PADDING = 4.5;

interface GroupedRow {
  values: ReportCellValue[];
  repeated: number;
  group: number;
}

export const tableLayout = (fills: string[]): CustomTableLayout => ({
  fillColor: (rowIndex) => (rowIndex === 0 ? BRAND_900 : (fills[rowIndex - 1] ?? CARD)),
  hLineWidth: () => 0,
  vLineWidth: () => 0,
  paddingLeft: (index) => (index === 0 ? EDGE_PADDING : COLUMN_PADDING),
  paddingRight: (index, node) =>
    index === (node.table.body[0]?.length ?? 0) - 1 ? EDGE_PADDING : COLUMN_PADDING,
  paddingTop: (rowIndex) => (rowIndex === 0 ? 7 : 4.5),
  paddingBottom: (rowIndex) => (rowIndex === 0 ? 7 : 4.5),
});

const alignmentFor = (column: ReportColumn) =>
  column.type === ReportColumnType.NUMBER ? 'right' : 'left';

const groupableCount = (columns: ReportColumn[]): number => {
  const firstNumber = columns.findIndex((column) => column.type === ReportColumnType.NUMBER);
  return Math.min(firstNumber === -1 ? columns.length : firstNumber, columns.length - 1);
};

const repeatedPrefix = (
  row: ReportCellValue[],
  previous: ReportCellValue[] | undefined,
  limit: number,
) => {
  let count = 0;
  while (count < limit && row[count] != null && row[count] === previous?.[count]) count += 1;
  return count;
};

export const groupRows = ({ columns, rows }: ReportTableSection): GroupedRow[] => {
  const limit = groupableCount(columns);
  let group = -1;
  return rows.map((values, index) => {
    const repeated = repeatedPrefix(values, rows[index - 1], limit);
    if (repeated === 0) group += 1;
    return { values, repeated, group };
  });
};

const valueCell = (column: ReportColumn, value: ReportCellValue, isResult: boolean): TableCell => {
  const text = breakLongWords(formatCellText(value, columnDecimals(column)));
  if (typeof value === 'number' && isResult) {
    return { text, style: 'result', color: gradeTone(value)?.foreground ?? BRAND_900 };
  }
  const tone = typeof value === 'string' ? statusTone(value) : undefined;
  return tone ? { text, style: 'status', color: tone.foreground } : { text };
};

const dataCell = (columns: ReportColumn[], row: GroupedRow, index: number): TableCell => {
  const column = columns[index]!;
  const alignment = alignmentFor(column);
  if (index < row.repeated) return { text: '', alignment };
  const value = normalizeCell(row.values[index], column.type);
  if (value === null) return { text: MISSING_VALUE_LABEL, style: 'missing', alignment };
  const cell = valueCell(column, value, index === resultColumnIndex(columns));
  return {
    ...(cell as object),
    alignment,
    ...(index === 0 ? { style: 'rowLead' } : {}),
  } as TableCell;
};

const headerCell = (column: ReportColumn): TableCell => ({
  text: breakLongWords(column.header),
  style: 'tableHeader',
  alignment: alignmentFor(column),
});

const columnWidth = ({ rows }: ReportTableSection, column: ReportColumn, index: number): Size => {
  if (column.pdfWidth !== undefined) return column.pdfWidth;
  if (column.type === ReportColumnType.NUMBER) return 'auto';
  const lengths = rows.map((row) => formatCellText(normalizeCell(row[index], column.type)).length);
  const isShort = Math.max(column.header.length, ...lengths) <= SHORT_TEXT_LENGTH;
  return isShort ? 'auto' : '*';
};

const tableWidths = (section: ReportTableSection): Size[] => {
  const widths = section.columns.map((column, index) => columnWidth(section, column, index));
  if (widths.includes('*')) return widths;
  const firstText = section.columns.findIndex((column) => column.type === ReportColumnType.TEXT);
  if (firstText === -1) return widths.map(() => '*');
  return widths.map((width, index) => (index === firstText ? '*' : width));
};

export const tableContent = (source: ReportTableSection): Content => {
  if (source.rows.length === 0) return messageContent(EMPTY_TABLE_MESSAGE);
  const section = withoutEmptyColumns(source);
  const rows = groupRows(section);
  return {
    table: {
      headerRows: 1,
      dontBreakRows: section.keepRowsTogether ?? false,
      widths: tableWidths(section),
      body: [
        section.columns.map(headerCell),
        ...rows.map((row) =>
          section.columns.map((_, index) => dataCell(section.columns, row, index)),
        ),
      ],
    },
    layout: tableLayout(rows.map(({ group }) => (group % 2 === 1 ? STRIPE : CARD))),
  };
};
