import type { CellValue, Worksheet } from 'exceljs';
import {
  ReportColumnType,
  type ReportCellValue,
  type ReportColumn,
  type ReportDocument,
  type ReportTableSection,
  type ReportTextSection,
} from '../../domain/report-document';
import {
  EMPTY_TABLE_MESSAGE,
  EMPTY_TEXT_SECTION_MESSAGE,
  MISSING_TEXT_LABEL,
  TEXT_SECTION_HEADERS,
  columnDecimals,
  formatCellText,
  normalizeCell,
} from '../report-cell';
import {
  TEXT_FORMAT,
  setColumnWidths,
  toExcelText,
  writeHeader,
  writeMessage,
  writePreamble,
} from './xlsx-sheet-layout';

const MIN_COLUMN_WIDTH = 10;
const MAX_COLUMN_WIDTH = 60;
const TEXT_SECTION_WIDTHS = [32, 100];
const CELL_ALIGNMENT = { vertical: 'top', wrapText: true } as const;

const toExcelValue = (value: ReportCellValue): CellValue =>
  typeof value === 'string' ? toExcelText(value) : value;

const numberFormat = (column: ReportColumn): string => {
  const decimals = columnDecimals(column);
  return decimals === 0 ? '0' : `0.${'0'.repeat(decimals)}`;
};

const writeDataRow = (sheet: Worksheet, columns: ReportColumn[], values: ReportCellValue[]) => {
  const cells = columns.map((column, index) => normalizeCell(values[index], column.type));
  const row = sheet.addRow(cells.map(toExcelValue));
  columns.forEach((column, index) => {
    const cell = row.getCell(index + 1);
    cell.alignment = CELL_ALIGNMENT;
    cell.numFmt = column.type === ReportColumnType.TEXT ? TEXT_FORMAT : numberFormat(column);
  });
};

const fittedWidths = (section: ReportTableSection): number[] =>
  section.columns.map((column, index) => {
    const lengths = section.rows.map(
      (row) =>
        formatCellText(normalizeCell(row[index], column.type), columnDecimals(column)).length,
    );
    const longest = Math.max(column.header.length, ...lengths);
    return Math.min(Math.max(longest + 2, MIN_COLUMN_WIDTH), MAX_COLUMN_WIDTH);
  });

export const writeTableSheet = (
  sheet: Worksheet,
  document: ReportDocument,
  section: ReportTableSection,
): void => {
  writePreamble(sheet, document, section.title);
  const header = writeHeader(
    sheet,
    section.columns.map((column) => column.header),
  );
  setColumnWidths(sheet, fittedWidths(section));
  if (section.rows.length === 0) return writeMessage(sheet, EMPTY_TABLE_MESSAGE);

  section.rows.forEach((values) => writeDataRow(sheet, section.columns, values));
  sheet.autoFilter = {
    from: { row: header.number, column: 1 },
    to: { row: header.number, column: section.columns.length },
  };
};

export const writeTextSheet = (
  sheet: Worksheet,
  document: ReportDocument,
  section: ReportTextSection,
): void => {
  writePreamble(sheet, document, section.title);
  writeHeader(sheet, TEXT_SECTION_HEADERS);
  setColumnWidths(sheet, TEXT_SECTION_WIDTHS);
  if (section.entries.length === 0) return writeMessage(sheet, EMPTY_TEXT_SECTION_MESSAGE);

  section.entries.forEach(({ label, text }) => {
    const row = sheet.addRow([toExcelText(label), toExcelText(text ?? MISSING_TEXT_LABEL)]);
    row.eachCell((cell) => {
      cell.alignment = CELL_ALIGNMENT;
      cell.numFmt = TEXT_FORMAT;
    });
  });
};
