import { ReportColumnType, type ReportTableSection } from '../domain/report-document';
import { resultColumnIndex, withoutEmptyColumns } from './report-table-view';

const section = (rows: ReportTableSection['rows']): ReportTableSection => ({
  kind: 'table',
  title: 'Notas',
  columns: [
    { header: 'Aluno', type: ReportColumnType.TEXT },
    { header: 'Matrícula', type: ReportColumnType.TEXT },
    { header: 'Marcações', type: ReportColumnType.TEXT },
    { header: 'Nota', type: ReportColumnType.NUMBER },
  ],
  rows,
});

describe('withoutEmptyColumns', () => {
  it('drops the columns that no row fills, such as a hidden student name', () => {
    const view = withoutEmptyColumns(
      section([
        [null, '001', '  ', 8],
        [null, '002', null, null],
      ]),
    );

    expect(view.columns.map((column) => column.header)).toEqual(['Matrícula', 'Nota']);
    expect(view.rows).toEqual([
      ['001', 8],
      ['002', null],
    ]);
  });

  it('keeps the table as it is when every column has a value', () => {
    const source = section([['Ana', '001', 'Proativo', 8]]);

    expect(withoutEmptyColumns(source)).toBe(source);
  });

  it('keeps the columns of a table without rows or without any value', () => {
    const empty = section([]);
    const blank = section([[null, null, null, null]]);

    expect(withoutEmptyColumns(empty)).toBe(empty);
    expect(withoutEmptyColumns(blank)).toBe(blank);
  });
});

describe('resultColumnIndex', () => {
  it('points to the last numeric column, where the final grade is', () => {
    expect(resultColumnIndex(section([]).columns)).toBe(3);
    expect(resultColumnIndex([{ header: 'Aluno', type: ReportColumnType.TEXT }])).toBe(-1);
  });
});
