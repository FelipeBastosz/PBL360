import { Workbook } from 'exceljs';
import { styleDataCell } from './xlsx-cell-style';

describe('styleDataCell', () => {
  const cell = () => new Workbook().addWorksheet('Notas').getCell('A1');

  it('stripes odd rows and emphasizes the lead cell', () => {
    const striped = cell();
    styleDataCell(striped, 'Ana', { rowIndex: 1, isLead: true, isResult: false });

    expect(striped.fill).toMatchObject({ fgColor: { argb: 'FFEEEEFB' } });
    expect(striped.font).toMatchObject({ bold: true });

    const even = cell();
    styleDataCell(even, 'Ana', { rowIndex: 2, isLead: false, isResult: false });
    expect(even.fill).toBeUndefined();
    expect(even.font).toBeUndefined();
  });

  it('applies known status colors and leaves unknown text unstyled', () => {
    const known = cell();
    styleDataCell(known, 'Presente', { rowIndex: 0, isLead: false, isResult: false });
    expect(known.font).toMatchObject({ bold: true, color: { argb: 'FF067647' } });

    const unknown = cell();
    styleDataCell(unknown, 'Status não mapeado', {
      rowIndex: 0,
      isLead: false,
      isResult: false,
    });
    expect(unknown.font).toBeUndefined();
  });

  it('colors numeric result grades and falls back for values outside the grade scale', () => {
    const passing = cell();
    styleDataCell(passing, 8, { rowIndex: 0, isLead: false, isResult: true });
    expect(passing.font).toMatchObject({ color: { argb: 'FF067647' } });

    const invalid = cell();
    styleDataCell(invalid, 11, { rowIndex: 0, isLead: false, isResult: true });
    expect(invalid.font).toMatchObject({ color: { argb: 'FF000077' } });

    const nonResult = cell();
    styleDataCell(nonResult, 8, { rowIndex: 0, isLead: false, isResult: false });
    expect(nonResult.font).toBeUndefined();
  });

  it('does not apply status or result styling to a missing value', () => {
    const missing = cell();
    styleDataCell(missing, null, { rowIndex: 0, isLead: false, isResult: true });

    expect(missing.font).toBeUndefined();
    expect(missing.fill).toBeUndefined();
  });
});
