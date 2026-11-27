import type { EntityManager } from 'typeorm';
import { reapplyDefaultSessionTables } from './default-session-tables.persistence';

describe('reapplyDefaultSessionTables', () => {
  it('does nothing when the problem has evaluations', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: 's1',
          date: '2025-01-01',
          orderIndex: 1,
          performanceTableId: 'custom',
          usesDefaultTable: true,
        },
      ])
      .mockResolvedValueOnce([{ exists: true }]);
    await reapplyDefaultSessionTables({ query } as unknown as EntityManager, 'p1');
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('updates only default-table sessions whose selected defaults changed', async () => {
    const sessions = [
      {
        id: 's1',
        date: '2025-01-01',
        orderIndex: 1,
        performanceTableId: 'custom',
        usesDefaultTable: true,
      },
      {
        id: 's2',
        date: '2025-02-01',
        orderIndex: 2,
        performanceTableId: 'old-default',
        usesDefaultTable: true,
      },
      {
        id: 's3',
        date: '2025-03-01',
        orderIndex: 3,
        performanceTableId: 'manual',
        usesDefaultTable: false,
      },
    ];
    const query = jest
      .fn()
      .mockResolvedValueOnce(sessions)
      .mockResolvedValueOnce([{ exists: false }]);
    await reapplyDefaultSessionTables({ query } as unknown as EntityManager, 'p1');
    expect(query).toHaveBeenCalledTimes(6);
    expect(query).toHaveBeenNthCalledWith(3, expect.stringContaining('UPDATE sessions'), [
      's1',
      expect.any(String),
    ]);
    expect(query).toHaveBeenNthCalledWith(5, expect.stringContaining('UPDATE sessions'), [
      's2',
      expect.any(String),
    ]);
  });

  it('does nothing when there are no sessions and the evaluation lookup returns no row', async () => {
    const query = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await reapplyDefaultSessionTables({ query } as unknown as EntityManager, 'p1');

    expect(query).toHaveBeenCalledTimes(2);
  });
});
