import type { EntityManager } from 'typeorm';
import { persistAdjustments, persistEvaluationItems } from './evaluation-item.persistence';

describe('evaluation persistence helpers', () => {
  it('deletes stale criteria and upserts each current evaluation item', async () => {
    const query = jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue(undefined);
    const manager = { query } as unknown as EntityManager;
    await persistEvaluationItems(manager, 'e1', [
      { criterionId: 'c1', score: 3 },
      { criterionId: 'c2', score: 4 },
    ]);
    expect(query).toHaveBeenCalledTimes(3);
    const calls = query.mock.calls as unknown[][];
    expect(calls[0]).toEqual([
      expect.stringContaining('DELETE FROM evaluation_items'),
      ['e1', ['c1', 'c2']],
    ]);
    expect(calls[1]?.[1]).toEqual(['e1', 'c1', 3]);
    expect(calls[2]?.[1]).toEqual(['e1', 'c2', 4]);
  });

  it('persists each score change with trimmed justification and supports empty changes', async () => {
    const query = jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue(undefined);
    const manager = { query } as unknown as EntityManager;
    const at = new Date('2025-01-01T00:00:00Z');
    await persistAdjustments(
      manager,
      [
        { itemId: 'i1', previousValue: 2, newValue: 4 },
        { itemId: 'i2', previousValue: null, newValue: 5 },
      ],
      't1',
      '  corrigido  ',
      at,
    );
    expect(query).toHaveBeenCalledTimes(2);
    const calls = query.mock.calls as unknown[][];
    expect(calls[0]?.[1]).toEqual(['i1', 2, 4, 'corrigido', 't1', at]);
    expect(calls[1]?.[1]).toEqual(['i2', null, 5, 'corrigido', 't1', at]);
    query.mockClear();
    await persistAdjustments(manager, [], 't1', 'x', at);
    expect(query).not.toHaveBeenCalled();
  });
});
