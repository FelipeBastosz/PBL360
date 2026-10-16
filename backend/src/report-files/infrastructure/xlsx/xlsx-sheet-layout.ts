import type { Fill, Font, Row, Worksheet } from 'exceljs';
import type { ReportDocument } from '../../domain/report-document';

export const TEXT_FORMAT = '@';
export const MAX_EXCEL_TEXT_LENGTH = 32767;

const TITLE_FONT: Partial<Font> = { bold: true, size: 14 };
const SECTION_FONT: Partial<Font> = { bold: true, size: 12 };
const BOLD_FONT: Partial<Font> = { bold: true };
const MESSAGE_FONT: Partial<Font> = { italic: true };
const HEADER_FILL: Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9EEF3' } };

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
    row.getCell(1).font = BOLD_FONT;
    row.getCell(2).numFmt = TEXT_FORMAT;
  });
  sheet.addRow([]);
};

export const writeHeader = (sheet: Worksheet, headers: string[]): Row => {
  const row = sheet.addRow(headers.map(toExcelText));
  row.eachCell((cell) => {
    cell.font = BOLD_FONT;
    cell.fill = HEADER_FILL;
    cell.border = { bottom: { style: 'thin' } };
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
