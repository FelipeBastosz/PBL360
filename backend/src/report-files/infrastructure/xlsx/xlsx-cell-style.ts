import type { Cell } from 'exceljs';
import type { ReportCellValue } from '../../domain/report-document';
import { BRAND_900, STRIPE, gradeTone, statusTone, toArgb } from '../report-palette';
import { solidFill } from './xlsx-sheet-layout';

export interface XlsxCellContext {
  rowIndex: number;
  isLead: boolean;
  isResult: boolean;
}

const styleStatus = (cell: Cell, value: string): boolean => {
  const tone = statusTone(value);
  if (!tone) return false;
  cell.font = { bold: true, color: { argb: toArgb(tone.foreground) } };
  cell.fill = solidFill(tone.background);
  return true;
};

const styleResult = (cell: Cell, value: number): void => {
  const color = gradeTone(value)?.foreground ?? BRAND_900;
  cell.font = { bold: true, color: { argb: toArgb(color) } };
};

export const styleDataCell = (
  cell: Cell,
  value: ReportCellValue,
  { rowIndex, isLead, isResult }: XlsxCellContext,
): void => {
  if (rowIndex % 2 === 1) cell.fill = solidFill(STRIPE);
  if (isLead) cell.font = { bold: true };
  if (typeof value === 'string' && styleStatus(cell, value)) return;
  if (typeof value === 'number' && isResult) styleResult(cell, value);
};
