import { ReportColumnType, type ReportTableSection } from '../../domain/report-document';
import { EMPTY_TABLE_MESSAGE, MISSING_VALUE_LABEL } from '../report-cell';
import { BRAND_900, CARD, STRIPE } from '../report-palette';
import { groupRows, tableContent, tableLayout } from './pdf-table-content';

const section = (overrides: Partial<ReportTableSection> = {}): ReportTableSection => ({
  kind: 'table',
  title: 'Notas',
  columns: [
    { header: 'Grupo', type: ReportColumnType.TEXT },
    { header: 'Observação', type: ReportColumnType.TEXT },
    { header: 'Nota', type: ReportColumnType.NUMBER },
  ],
  rows: [
    ['A', 'Mesma mesa', 8],
    ['A', 'Mesma mesa', null],
    ['B', 'Pendente', 4],
  ],
  ...overrides,
});

describe('PDF table content', () => {
  it('groups consecutive rows that repeat the same prefix', () => {
    expect(groupRows(section())).toEqual([
      { values: ['A', 'Mesma mesa', 8], repeated: 0, group: 0 },
      { values: ['A', 'Mesma mesa', null], repeated: 2, group: 0 },
      { values: ['B', 'Pendente', 4], repeated: 0, group: 1 },
    ]);
  });

  it('handles columns without a number and a single number column', () => {
    const textColumns = section({
      columns: [{ header: 'Nome', type: ReportColumnType.TEXT }],
      rows: [['Ana'], ['Ana']],
    });
    expect(groupRows(textColumns).map(({ repeated, group }) => ({ repeated, group }))).toEqual([
      { repeated: 0, group: 0 },
      { repeated: 0, group: 1 },
    ]);

    const numericColumn = section({
      columns: [{ header: 'Nota', type: ReportColumnType.NUMBER }],
      rows: [[8], [8]],
    });
    expect(groupRows(numericColumn).map(({ repeated, group }) => ({ repeated, group }))).toEqual([
      { repeated: 0, group: 0 },
      { repeated: 0, group: 1 },
    ]);
  });

  it('styles table header, alternating groups, repeated cells, missing values and results', () => {
    const content = tableContent(section({ keepRowsTogether: true })) as {
      table: {
        dontBreakRows: boolean;
        widths: unknown[];
        body: Array<Array<Record<string, unknown>>>;
      };
      layout: {
        fillColor: (rowIndex: number) => string;
      };
    };

    expect(content.table.dontBreakRows).toBe(true);
    expect(content.table.widths).toEqual(['*', 'auto', 'auto']);
    expect(content.table.body[0]![0]).toMatchObject({ text: 'Grupo', style: 'tableHeader' });
    expect(content.table.body[1]![0]).toMatchObject({
      text: 'A',
      style: 'rowLead',
    });
    expect(content.table.body[2]![0]).toMatchObject({ text: '', alignment: 'left' });
    expect(content.table.body[2]![2]).toMatchObject({
      text: MISSING_VALUE_LABEL,
      style: 'missing',
    });
    expect(content.table.body[3]![1]).toMatchObject({ text: 'Pendente', style: 'status' });
    expect(content.table.body[3]![2]).toMatchObject({
      text: '4,0',
      style: 'result',
      color: '#B42318',
    });
    expect(content.layout.fillColor(0)).toBe(BRAND_900);
    expect(content.layout.fillColor(1)).toBe(CARD);
    expect(content.layout.fillColor(3)).toBe(STRIPE);

    const standaloneLayout = tableLayout([CARD, STRIPE]);
    expect(standaloneLayout.fillColor(2)).toBe(STRIPE);
    expect(standaloneLayout.fillColor(3)).toBe(CARD);
  });

  it('uses explicit widths, long text widths and flexible widths for numeric-only tables', () => {
    const explicit = tableContent(
      section({
        columns: [
          { header: 'Nome', type: ReportColumnType.TEXT, pdfWidth: 120 },
          { header: 'Observação', type: ReportColumnType.TEXT },
          { header: 'Nota', type: ReportColumnType.NUMBER },
        ],
        rows: [['Ana', 'Uma observação longa para permitir a largura flexível', 8]],
      }),
    ) as { table: { widths: unknown[] } };
    expect(explicit.table.widths).toEqual([120, '*', 'auto']);

    const longText = tableContent(
      section({
        columns: [
          { header: 'Observação', type: ReportColumnType.TEXT },
          { header: 'Nota', type: ReportColumnType.NUMBER },
        ],
        rows: [['Uma observação acadêmica mais extensa', 8]],
      }),
    ) as { table: { widths: unknown[] } };
    expect(longText.table.widths).toEqual(['*', 'auto']);

    const numbers = tableContent(
      section({
        columns: [{ header: 'Nota', type: ReportColumnType.NUMBER }],
        rows: [[8]],
      }),
    ) as { table: { widths: unknown[] } };
    expect(numbers.table.widths).toEqual(['*']);
  });

  it('uses the brand color when a numeric result is outside the grade scale', () => {
    const content = tableContent(
      section({
        columns: [{ header: 'Nota', type: ReportColumnType.NUMBER }],
        rows: [[11]],
      }),
    ) as { table: { body: Array<Array<Record<string, unknown>>> } };

    expect(content.table.body[1]![0]).toMatchObject({
      text: '11,0',
      style: 'rowLead',
      color: BRAND_900,
    });
  });

  it('renders an empty-table message and applies table edge padding', () => {
    expect(tableContent(section({ rows: [] }))).toMatchObject({
      text: EMPTY_TABLE_MESSAGE,
      style: 'message',
    });

    const layout = tableLayout([CARD, STRIPE]);
    const node = { table: { body: [['A', 'B']] } } as never;
    expect(layout.fillColor(1)).toBe(CARD);
    expect(layout.paddingLeft(0)).toBe(12);
    expect(layout.paddingLeft(1)).toBe(4.5);
    expect(layout.paddingRight(1, node)).toBe(12);
    expect(layout.paddingRight(0, node)).toBe(4.5);
    expect(layout.paddingRight(0, { table: { body: [] } })).toBe(4.5);
    expect(layout.paddingTop(0)).toBe(7);
    expect(layout.paddingTop(1)).toBe(4.5);
    expect(layout.paddingBottom(0)).toBe(7);
    expect(layout.paddingBottom(1)).toBe(4.5);
    expect(layout.hLineWidth()).toBe(0);
    expect(layout.vLineWidth()).toBe(0);
  });
});
