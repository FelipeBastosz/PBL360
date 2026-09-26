import { InvalidPerformanceTableError } from '../errors/invalid-performance-table.error';
import type { NewPerformanceTable } from './new-performance-table';
import { PerformanceTable } from './performance-table.entity';

function validTableData(): NewPerformanceTable {
  return {
    tutorId: 'tutor-123',
    name: 'Avaliação tutorial',
    criteria: [{ name: 'Participação' }],
  };
}

describe('PerformanceTable', () => {
  it('creates a table with its criteria', () => {
    const table = PerformanceTable.create(validTableData());

    expect(table.name).toBe('Avaliação tutorial');
    expect(table.criteria).toEqual([
      expect.objectContaining({ name: 'Participação', orderIndex: 1 }),
    ]);
  });

  it('removes surrounding spaces from table and criterion names', () => {
    const table = PerformanceTable.create({
      ...validTableData(),
      name: '  Avaliação tutorial  ',
      criteria: [{ name: '  Participação  ' }],
    });

    expect(table.name).toBe('Avaliação tutorial');
    expect(table.criteria).toEqual([expect.objectContaining({ name: 'Participação' })]);
  });

  it('rejects a table without a name', () => {
    expect(() => PerformanceTable.create({ ...validTableData(), name: '   ' })).toThrow(
      InvalidPerformanceTableError,
    );
  });

  it('rejects a table without criteria', () => {
    expect(() => PerformanceTable.create({ ...validTableData(), criteria: [] })).toThrow(
      InvalidPerformanceTableError,
    );
  });

  it('rejects a criterion without a name', () => {
    expect(() =>
      PerformanceTable.create({ ...validTableData(), criteria: [{ name: '   ' }] }),
    ).toThrow(InvalidPerformanceTableError);
  });
});
