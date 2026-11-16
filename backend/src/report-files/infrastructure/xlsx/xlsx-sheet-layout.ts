import type { Fill, Font, Row, Worksheet } from 'exceljs';
import type { ReportDocument } from '../../domain/report-document';
import { BRAND_900, INK, MUTED, WHITE, toArgb } from '../report-palette';

export const TEXT_FORMAT = '@';
export const MAX_EXCEL_TEXT_LENGTH = 32767;

const HEADER_ROW_HEIGHT = 22;
const TITLE_FONT: Partial<Font> = { bold: true, size: 14, color: { argb: toArgb(BRAND_900) } };
const SECTION_FONT: Partial<Font> = { bold: true, size: 12, color: { argb: toArgb(BRAND_900) } };
const LABEL_FONT: Partial<Font> = { bold: true, size: 9, color: { argb: toArgb(MUTED) } };
const VALUE_FONT: Partial<Font> = { bold: true, color: { argb: toArgb(INK) } };
const HEADER_FONT: Partial<Font> = { bold: true, color: { argb: toArgb(WHITE) } };
const MESSAGE_FONT: Partial<Font> = { italic: true, color: { argb: toArgb(MUTED) } };

export const solidFill = (hex: string): Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: toArgb(hex) },
});

export const toExcelText = (text: string): string => text.slice(0, MAX_EXCEL_TEXT_LENGTH);

export const writePreamble = (
  sheet: Worksheet,
  document: ReportDocument,
  sectionTitle: string | null,
): void => {
  sheet.addRow([toExcelText(document.title)]).font = TITLE_FONT;
  if (sectionTitle !== null) sheet.addRow([toExcelText(sectionTitle)]).font = SECTION_FONT;
  document.identification.forEach(({ label, value }) => {
    const row = sheet.addRow([toExcelText(label), toExcelText(value)]);
    row.getCell(1).font = LABEL_FONT;
    row.getCell(2).font = VALUE_FONT;
    row.getCell(2).numFmt = TEXT_FORMAT;
  });
  sheet.addRow([]);
};

export const writeHeader = (sheet: Worksheet, headers: string[]): Row => {
  const row = sheet.addRow(headers.map(toExcelText));
  row.height = HEADER_ROW_HEIGHT;
  row.eachCell((cell) => {
    cell.font = HEADER_FONT;
    cell.fill = solidFill(BRAND_900);
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
  sheet.views = [{ state: 'frozen', ySplit: row.number }];
  return row;
};

export const writeMessage = (sheet: Worksheet, message: string): void => {
  sheet.addRow([message]).font = MESSAGE_FONT;
};

export const setColumnWidths = (sheet: Worksheet, widths: number[]): void => {
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
};
