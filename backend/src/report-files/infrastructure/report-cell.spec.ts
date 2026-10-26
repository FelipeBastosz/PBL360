import { ReportColumnType } from '../domain/report-document';
import { MISSING_VALUE_LABEL, columnDecimals, formatCellText, normalizeCell } from './report-cell';

describe('normalizeCell', () => {
  it('keeps a missing value as missing instead of zero', () => {
    expect(normalizeCell(null, ReportColumnType.NUMBER)).toBeNull();
    expect(normalizeCell(undefined, ReportColumnType.NUMBER)).toBeNull();
  });

  it('treats a non finite number as missing', () => {
    expect(normalizeCell(Number.NaN, ReportColumnType.NUMBER)).toBeNull();
    expect(normalizeCell(Number.POSITIVE_INFINITY, ReportColumnType.NUMBER)).toBeNull();
  });

  it('keeps zero as a real grade', () => {
    expect(normalizeCell(0, ReportColumnType.NUMBER)).toBe(0);
  });

  it('turns a number in a text column into text', () => {
    expect(normalizeCell(123, ReportColumnType.TEXT)).toBe('123');
  });

  it('keeps text in a number column as text', () => {
    expect(normalizeCell('Pendente', ReportColumnType.NUMBER)).toBe('Pendente');
    expect(normalizeCell('1.234,5', ReportColumnType.NUMBER)).toBe('1.234,5');
  });

  it('turns numeric text in a number column into a number', () => {
    expect(normalizeCell('8.5', ReportColumnType.NUMBER)).toBe(8.5);
    expect(normalizeCell('8,5', ReportColumnType.NUMBER)).toBe(8.5);
    expect(normalizeCell(' 10 ', ReportColumnType.NUMBER)).toBe(10);
    expect(normalizeCell('-2', ReportColumnType.NUMBER)).toBe(-2);
  });

  it('keeps numeric text in a text column untouched', () => {
    expect(normalizeCell('00123', ReportColumnType.TEXT)).toBe('00123');
  });
});

describe('formatCellText', () => {
  it('formats numbers in Brazilian Portuguese with fixed decimals', () => {
    expect(formatCellText(8.5)).toBe('8,50');
    expect(formatCellText(7.333, 1)).toBe('7,3');
    expect(formatCellText(3, 0)).toBe('3');
  });

  it('shows a dash for missing values', () => {
    expect(formatCellText(null)).toBe(MISSING_VALUE_LABEL);
  });
});

describe('columnDecimals', () => {
  it('defaults to two decimals and keeps the value within bounds', () => {
    const column = { header: 'Nota', type: ReportColumnType.NUMBER };
    expect(columnDecimals(column)).toBe(2);
    expect(columnDecimals({ ...column, decimals: 0 })).toBe(0);
    expect(columnDecimals({ ...column, decimals: -3 })).toBe(0);
    expect(columnDecimals({ ...column, decimals: 40 })).toBe(6);
    expect(columnDecimals({ ...column, decimals: Number.NaN })).toBe(2);
  });
});
