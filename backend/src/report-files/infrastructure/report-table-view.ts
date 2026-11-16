import {
  ReportColumnType,
  type ReportCellValue,
  type ReportColumn,
  type ReportTableSection,
} from '../domain/report-document';
import { normalizeCell } from './report-cell';

const isFilled = (value: ReportCellValue): boolean =>
  value !== null && (typeof value !== 'string' || value.trim() !== '');

const isVisible = (section: ReportTableSection, index: number): boolean => {
  const { type } = section.columns[index]!;
  if (type === ReportColumnType.NUMBER) return true;
  return section.rows.some((row) => isFilled(normalizeCell(row[index], type)));
};

export const withoutEmptyColumns = (section: ReportTableSection): ReportTableSection => {
  if (section.rows.length === 0) return section;
  const kept = section.columns.flatMap((_, index) => (isVisible(section, index) ? [index] : []));
  if (kept.length === 0 || kept.length === section.columns.length) return section;
  return {
    ...section,
    columns: kept.map((index) => section.columns[index]!),
    rows: section.rows.map((row) => kept.map((index) => row[index] ?? null)),
  };
};

export const resultColumnIndex = (columns: ReportColumn[]): number =>
  columns.findLastIndex((column) => column.type === ReportColumnType.NUMBER);
