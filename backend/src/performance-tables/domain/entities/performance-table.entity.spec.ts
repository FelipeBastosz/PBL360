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

  it.each([-1, 10.01])('rejects a criterion with invalid weight %s', (weight) => {
    expect(() =>
      PerformanceTable.create({
        ...validTableData(),
        criteria: [{ name: 'Postura', weight }],
      }),
    ).toThrow(InvalidPerformanceTableError);
  });

  it('preserves existing ids and leaves new criteria without an id', () => {
    const table = PerformanceTable.create(validTableData());
    table.id = 'table-1';
    table.criteria[0]!.id = 'criterion-1';

    table.update({
      name: 'Barema atualizado',
      description: null,
      criteria: [
        { id: 'criterion-1', name: 'Participação nas discussões', weight: 3 },
        { name: 'Evolução', weight: 2 },
      ],
    });

    expect(table.criteria[0]).toMatchObject({
      id: 'criterion-1',
      name: 'Participação nas discussões',
      weight: 3,
      orderIndex: 1,
      performanceTableId: 'table-1',
    });
    expect(table.criteria[1]!.id).toBeUndefined();
    expect(table.criteria[1]!.orderIndex).toBe(2);
    expect(table.criteria.every((criterion) => criterion.performanceTable === table)).toBe(true);
    expect(table.description).toBeNull();
  });

  it('rejects duplicate criterion ids without changing the table', () => {
    const table = PerformanceTable.create(validTableData());
    table.criteria[0]!.id = 'criterion-1';
    const criteria = table.criteria;

    expect(() =>
      table.update({
        name: 'Não deve ser salvo',
        criteria: [
          { id: 'criterion-1', name: 'Participação' },
          { id: 'criterion-1', name: 'Outro nome' },
        ],
      }),
    ).toThrow('Os critérios da tabela não podem repetir o identificador.');
    expect(table.name).toBe('Avaliação tutorial');
    expect(table.criteria).toBe(criteria);
  });

  it('rejects a criterion outside the active configuration', () => {
    const table = PerformanceTable.create(validTableData());
    table.criteria[0]!.id = 'criterion-1';

    expect(() =>
      table.update({
        name: 'Barema',
        criteria: [{ id: 'another-criterion', name: 'Participação' }],
      }),
    ).toThrow('Um ou mais critérios não pertencem à configuração ativa desta tabela.');
  });

  it('keeps the original configuration when candidate validation fails', () => {
    const table = PerformanceTable.create(validTableData());
    const criteria = table.criteria;

    expect(() => table.update({ name: 'Novo nome', criteria: [] })).toThrow(
      InvalidPerformanceTableError,
    );
    expect(table.name).toBe('Avaliação tutorial');
    expect(table.criteria).toBe(criteria);
  });

  it('rejects repeated order indexes when updating criteria', () => {
    const table = PerformanceTable.create(validTableData());
    table.criteria[0]!.id = 'criterion-1';

    expect(() =>
      table.update({
        name: 'Barema',
        criteria: [
          { id: 'criterion-1', name: 'Participação', orderIndex: 1 },
          { name: 'Evolução', orderIndex: 1 },
        ],
      }),
    ).toThrow('Os critérios da tabela de desempenho não podem repetir a ordem.');
  });
});
