import type { EntityManager } from 'typeorm';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { readSessionFormula } from './session-formula-configuration.persistence';
import {
  readSessionConfiguration,
  readSessionTable,
  readTableCriteria,
  toEvaluationFormula,
} from './session-configuration.read.persistence';

jest.mock('./session-formula-configuration.persistence', () => ({
  readSessionFormula: jest.fn(),
}));

function managerFor(results: unknown[][]) {
  const query = jest.fn();
  results.forEach((result) => query.mockResolvedValueOnce(result));
  return { manager: { query } as unknown as EntityManager, query };
}

describe('session configuration reads', () => {
  it('reads a session table and reports when none is active', async () => {
    const { manager, query } = managerFor([[{ id: 'table-1', name: 'Barema', isDefault: false }]]);
    await expect(readSessionTable(manager, 'session-1')).resolves.toEqual({
      id: 'table-1',
      name: 'Barema',
      isDefault: false,
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('pt.deleted_at IS NULL'), [
      'session-1',
    ]);

    const missing = managerFor([[]]);
    await expect(readSessionTable(missing.manager, 'missing')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('reads table criteria', async () => {
    const rows = [
      { id: 'criterion-1', name: 'Participação', description: null, weight: '2.5', orderIndex: 1 },
    ];
    const { manager, query } = managerFor([rows]);
    await expect(readTableCriteria(manager, 'table-1')).resolves.toEqual(rows);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY order_index, created_at, id'),
      ['table-1'],
    );
  });

  it('builds a complete session configuration and converts criterion weights', async () => {
    const { manager } = managerFor([
      [{ id: 'table-1', name: 'Barema', isDefault: true }],
      [
        {
          id: 'criterion-1',
          name: 'Participação',
          description: null,
          weight: '2.5',
          orderIndex: 1,
        },
      ],
    ]);
    jest.mocked(readSessionFormula).mockResolvedValue([
      { type: 'CRITERIOS', weight: '70' },
      { type: 'PAPEL', weight: 30 },
    ]);

    await expect(readSessionConfiguration(manager, 'session-1')).resolves.toEqual({
      tableId: 'table-1',
      tableName: 'Barema',
      criteria: [
        { id: 'criterion-1', name: 'Participação', description: null, weight: 2.5, orderIndex: 1 },
      ],
      frozen: false,
      formula: { criteriaWeight: 70, roleWeight: 30 },
    });
  });

  it('rejects empty criteria and incomplete evaluation formulas', async () => {
    const { manager } = managerFor([[{ id: 'table-1', name: 'Barema', isDefault: false }], []]);
    await expect(readSessionConfiguration(manager, 'session-1')).rejects.toBeInstanceOf(
      UnprocessableEntityError,
    );

    expect(() => toEvaluationFormula([{ type: 'CRITERIOS', weight: '70' }])).toThrow(
      UnprocessableEntityError,
    );
  });

  it('requires both formula components and converts string and numeric weights', () => {
    expect(
      toEvaluationFormula([
        { type: 'CRITERIOS', weight: '65.5' },
        { type: 'PAPEL', weight: 34.5 },
      ]),
    ).toEqual({ criteriaWeight: 65.5, roleWeight: 34.5 });
    expect(() => toEvaluationFormula([{ type: 'PAPEL', weight: 100 }])).toThrow(
      UnprocessableEntityError,
    );
  });
});
