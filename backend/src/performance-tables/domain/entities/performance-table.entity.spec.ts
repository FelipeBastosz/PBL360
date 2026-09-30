import { InvalidPerformanceTableError } from '../errors/invalid-performance-table.error';
import type { NewPerformanceTable } from './new-performance-table';
import { PerformanceTable } from './performance-table.entity';

function validTableData(): NewPerformanceTable {
  return {
    tutorId: 'tutor-123',
    name: 'Avaliação tutorial',
    criteria: [
      {
        name: 'Participação',
        description: 'Envolvimento nas atividades',
        orderIndex: 1,
        weight: 0.5,
      },
    ],
  };
}

describe('PerformanceTable', () => {
  it('creates a table with its criteria', () => {
    const table = PerformanceTable.create(validTableData());

    expect(table.name).toBe('Avaliação tutorial');
    expect(table.criteria).toEqual([
      expect.objectContaining({
        name: 'Participação',
        description: 'Envolvimento nas atividades',
        orderIndex: 1,
        weight: 0.5,
      }),
    ]);
  });

  it('removes surrounding spaces from table and criterion names', () => {
    const table = PerformanceTable.create({
      ...validTableData(),
      name: '  Avaliação tutorial  ',
      criteria: [
        {
          name: '  Participação  ',
          description: '  Envolvimento nas atividades  ',
          orderIndex: 1,
          weight: 0.5,
        },
      ],
    });

    expect(table.name).toBe('Avaliação tutorial');
    expect(table.criteria).toEqual([
      expect.objectContaining({
        name: 'Participação',
        description: 'Envolvimento nas atividades',
        orderIndex: 1,
        weight: 0.5,
      }),
    ]);
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

  it('rejects criteria with repeated order indexes', () => {
    expect(() =>
      PerformanceTable.create({
        ...validTableData(),
        criteria: [
          { name: 'Participação', orderIndex: 1, weight: 0.5 },
          { name: 'Comunicação', orderIndex: 1, weight: 0.5 },
        ],
      }),
    ).toThrow(InvalidPerformanceTableError);
  });

  it('rejects a criterion without a name', () => {
    expect(() =>
      PerformanceTable.create({
        ...validTableData(),
        criteria: [{ name: '   ', orderIndex: 1, weight: 0.5 }],
      }),
    ).toThrow(InvalidPerformanceTableError);
  });

  it('defaults the description, order and weight of a criterion', () => {
    const table = PerformanceTable.create({
      ...validTableData(),
      criteria: [{ name: 'Participação' }],
    });

    expect(table.description).toBeNull();
    expect(table.criteria[0]).toEqual(
      expect.objectContaining({ description: null, orderIndex: 1, weight: 1 }),
    );
  });

  it('keeps the criterion description, order and weight informed', () => {
    const table = PerformanceTable.create({
      ...validTableData(),
      description: '  Critérios do módulo  ',
      criteria: [
        {
          name: 'Postura',
          description: '  Participação durante as discussões  ',
          orderIndex: 2,
          weight: 2,
        },
      ],
    });

    expect(table.description).toBe('Critérios do módulo');
    expect(table.criteria[0]).toEqual(
      expect.objectContaining({
        name: 'Postura',
        description: 'Participação durante as discussões',
        orderIndex: 2,
        weight: 2,
      }),
    );
  });

  it.each([0, -1, 1.5])('rejects a criterion with invalid order %s', (orderIndex) => {
    expect(() =>
      PerformanceTable.create({
        ...validTableData(),
        criteria: [{ name: 'Postura', orderIndex }],
      }),
    ).toThrow(InvalidPerformanceTableError);
  });

  it.each([0, 10, -1])('rejects a criterion with invalid weight %s', (weight) => {
    expect(() =>
      PerformanceTable.create({
        ...validTableData(),
        criteria: [{ name: 'Postura', weight }],
      }),
    ).toThrow(InvalidPerformanceTableError);
  });
});
