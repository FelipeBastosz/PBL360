import type { EntityManager } from 'typeorm';
import { InvalidPerformanceTableError } from '../../domain/errors/invalid-performance-table.error';
import { syncPerformanceCriteria } from './performance-criteria.persistence';

describe('syncPerformanceCriteria', () => {
  it('validates retained criteria, archives omissions and updates/inserts the current list', async () => {
    const query = jest
      .fn<Promise<unknown[]>, [string, unknown[]]>()
      .mockResolvedValueOnce([{ id: 'c1' }]);
    await syncPerformanceCriteria(
      { query } as unknown as EntityManager,
      {
        id: 'pt1',
        criteria: [
          { id: 'c1', name: 'Presença', description: null, orderIndex: 1, weight: 2 },
          { id: undefined, name: 'Participação', description: 'Atuação', orderIndex: 2, weight: 3 },
        ],
      } as never,
    );
    expect(query).toHaveBeenCalledTimes(5);
    expect(query.mock.calls[0]?.[1]).toEqual(['pt1', ['c1']]);
    expect(query.mock.calls[3]?.[1]).toEqual(['pt1', 'Presença', null, 1, 2, 'c1']);
    expect(query.mock.calls[4]?.[1]).toEqual(['pt1', 'Participação', 'Atuação', 2, 3]);
  });

  it('rejects criterion ids that are not active on the table', async () => {
    const query = jest.fn().mockResolvedValue([]);
    await expect(
      syncPerformanceCriteria(
        { query } as unknown as EntityManager,
        {
          id: 'pt1',
          criteria: [
            { id: 'not-on-table', name: 'Item', description: null, orderIndex: 1, weight: 1 },
          ],
        } as never,
      ),
    ).rejects.toThrow(
      new InvalidPerformanceTableError(
        'Um ou mais critérios não pertencem à configuração ativa desta tabela.',
      ),
    );
    expect(query).toHaveBeenCalledTimes(1);
  });
});
