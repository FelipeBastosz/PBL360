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
        weight: 10,
      },
    ],
  };
}

describe('PerformanceTable', () => {
  it('preserves criterion identity when editing weights in a table already used', () => {
    const table = PerformanceTable.create({
      ...validTableData(),
      criteria: [{ name: 'Participação', weight: 10 }],
    });
    table.criteria[0]!.id = 'criterion';
    table.update(
      { name: table.name, criteria: [{ id: 'criterion', name: 'Participação', weight: 10 }] },
      true,
    );
    expect(table.criteria[0]!.id).toBe('criterion');
  });

  it('creates a table with its criteria', () => {
    const table = PerformanceTable.create(validTableData());

    expect(table.name).toBe('Avaliação tutorial');
    expect(table.criteria).toEqual([
      expect.objectContaining({
        name: 'Participação',
        description: 'Envolvimento nas atividades',
        orderIndex: 1,
        weight: 10,
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
          weight: 10,
        },
      ],
    });

    expect(table.name).toBe('Avaliação tutorial');
    expect(table.criteria).toEqual([
      expect.objectContaining({
        name: 'Participação',
        description: 'Envolvimento nas atividades',
        orderIndex: 1,
        weight: 10,
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
          { name: 'Participação', orderIndex: 1, weight: 5 },
          { name: 'Comunicação', orderIndex: 1, weight: 5 },
        ],
      }),
    ).toThrow(InvalidPerformanceTableError);
  });

  it('rejects a criterion without a name', () => {
    expect(() =>
      PerformanceTable.create({
        ...validTableData(),
        criteria: [{ name: '   ', orderIndex: 1, weight: 10 }],
      }),
    ).toThrow(InvalidPerformanceTableError);
  });

  it('defaults the description, order and weight of a criterion', () => {
    const table = PerformanceTable.create({
      ...validTableData(),
      criteria: Array.from({ length: 10 }, (_, index) => ({
        name: `Critério ${index + 1}`,
      })),
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
          weight: 7,
        },
        {
          name: 'Participação',
          orderIndex: 1,
          weight: 3,
        },
      ],
    });

    expect(table.description).toBe('Critérios do módulo');
    expect(table.criteria[0]).toEqual(
      expect.objectContaining({
        name: 'Postura',
        description: 'Participação durante as discussões',
        orderIndex: 2,
        weight: 7,
      }),
    );
  });

  it.each([0, -1, 1.5])('rejects a criterion with invalid order %s', (orderIndex) => {
    expect(() =>
      PerformanceTable.create({
        ...validTableData(),
        criteria: [{ name: 'Postura', orderIndex, weight: 10 }],
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

  it.each([
    {
      sum: 'menor que 10',
      criteria: [
        { name: 'Postura', weight: 4 },
        { name: 'Participação', weight: 5 },
      ],
    },
    {
      sum: 'maior que 10',
      criteria: [
        { name: 'Postura', weight: 6 },
        { name: 'Participação', weight: 5 },
      ],
    },
  ])('rejects a table when the sum of criteria weights is $sum', ({ criteria }) => {
    expect(() =>
      PerformanceTable.create({
        ...validTableData(),
        criteria,
      }),
    ).toThrow('A soma dos pesos dos critérios deve ser igual a 10.');
  });

  it('accepts decimal weights that sum to 10', () => {
    const table = PerformanceTable.create({
      ...validTableData(),
      criteria: [
        { name: 'Critério 1', weight: 3.33 },
        { name: 'Critério 2', weight: 3.33 },
        { name: 'Critério 3', weight: 3.34 },
      ],
    });

    expect(table.criteria).toHaveLength(3);
  });

  it('allows only weight changes in the default table', () => {
    const table = PerformanceTable.create({
      tutorId: 'tutor-123',
      name: 'Fórmula Padrão',
      description: 'Critérios padrão de avaliação.',
      isDefault: true,
      criteria: [
        { name: 'Seguimento', description: 'Seguir orientações.', orderIndex: 1, weight: 3 },
        { name: 'Participação', description: 'Participar.', orderIndex: 2, weight: 7 },
      ],
    });
    table.criteria.forEach((criterion, index) => {
      criterion.id = `criterion-${index + 1}`;
    });

    table.update({
      name: 'Fórmula Padrão',
      description: 'Critérios padrão de avaliação.',
      criteria: [
        {
          id: 'criterion-1',
          name: 'Seguimento',
          description: 'Seguir orientações.',
          orderIndex: 1,
          weight: 4,
        },
        {
          id: 'criterion-2',
          name: 'Participação',
          description: 'Participar.',
          orderIndex: 2,
          weight: 6,
        },
      ],
    });

    expect(table.criteria.map((criterion) => criterion.weight)).toEqual([4, 6]);
  });

  it('allows only weight changes when a table has a past session', () => {
    const table = PerformanceTable.create({
      tutorId: 'tutor-123',
      name: 'Barema',
      criteria: [
        { name: 'Participação', orderIndex: 1, weight: 5 },
        { name: 'Postura', orderIndex: 2, weight: 5 },
      ],
    });
    table.criteria.forEach((criterion, index) => {
      criterion.id = `criterion-${index + 1}`;
    });

    expect(() =>
      table.update(
        {
          name: 'Outro barema',
          criteria: [
            { id: 'criterion-1', name: 'Participação', weight: 5 },
            { id: 'criterion-2', name: 'Postura', weight: 5 },
          ],
        },
        true,
      ),
    ).toThrow('Somente os pesos podem ser alterados.');

    table.update(
      {
        name: 'Barema',
        criteria: [
          { id: 'criterion-1', name: 'Participação', weight: 6 },
          { id: 'criterion-2', name: 'Postura', weight: 4 },
        ],
      },
      true,
    );
    expect(table.criteria.map((criterion) => criterion.weight)).toEqual([6, 4]);
  });

  it.each(['name', 'description'])('rejects changing the default table %s', (field) => {
    const table = PerformanceTable.create({
      ...validTableData(),
      isDefault: true,
      name: 'Fórmula Padrão',
      description: 'Critérios padrão de avaliação.',
    });
    table.criteria[0]!.id = 'criterion-1';

    expect(() =>
      table.update({
        name: field === 'name' ? 'Outra' : 'Fórmula Padrão',
        description: field === 'description' ? 'Outra' : 'Critérios padrão de avaliação.',
        criteria: [{ id: 'criterion-1', name: 'Participação', weight: 10 }],
      }),
    ).toThrow('não podem ser alterados');
  });

  it('rejects deleting the default table', () => {
    const table = PerformanceTable.create({ ...validTableData(), isDefault: true });

    expect(() => table.delete()).toThrow('não pode ser excluída');
  });

  it('preserves existing ids and leaves new criteria without an id', () => {
    const table = PerformanceTable.create(validTableData());
    table.id = 'table-1';
    table.criteria[0]!.id = 'criterion-1';

    table.update({
      name: 'Barema atualizado',
      description: null,
      criteria: [
        { id: 'criterion-1', name: 'Participação nas discussões', weight: 6 },
        { name: 'Evolução', weight: 4 },
      ],
    });

    expect(table.criteria[0]).toMatchObject({
      id: 'criterion-1',
      name: 'Participação nas discussões',
      weight: 6,
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
          { id: 'criterion-1', name: 'Participação', weight: 5 },
          { id: 'criterion-1', name: 'Outro nome', weight: 5 },
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
        criteria: [{ id: 'another-criterion', name: 'Participação', weight: 10 }],
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
          { id: 'criterion-1', name: 'Participação', orderIndex: 1, weight: 5 },
          { name: 'Evolução', orderIndex: 1, weight: 5 },
        ],
      }),
    ).toThrow('Os critérios da tabela de desempenho não podem repetir a ordem.');
  });

  it('rejects updating a table when criteria weights do not sum to 10 and preserves state', () => {
    const table = PerformanceTable.create(validTableData());
    table.criteria[0]!.id = 'criterion-1';
    const criteria = table.criteria;

    expect(() =>
      table.update({
        name: 'Novo nome',
        criteria: [{ id: 'criterion-1', name: 'Participação', weight: 7 }],
      }),
    ).toThrow('A soma dos pesos dos critérios deve ser igual a 10.');
    expect(table.name).toBe('Avaliação tutorial');
    expect(table.criteria).toBe(criteria);
  });
});
