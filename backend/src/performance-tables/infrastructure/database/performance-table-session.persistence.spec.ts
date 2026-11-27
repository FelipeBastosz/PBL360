import type { EntityManager } from 'typeorm';
import { ConflictError } from '@/shared/errors/application.error';
import { propagatePerformanceTableSessions } from './performance-table-session.persistence';

describe('propagatePerformanceTableSessions', () => {
  const table = { id: 'pt1', name: 'Nova tabela' } as never;

  it('refreshes session snapshots, criteria, drafts and calculated grades', async () => {
    const query = jest
      .fn<Promise<unknown[]>, [string, unknown[]]>()
      .mockResolvedValueOnce([{ exists: false }]);
    await expect(
      propagatePerformanceTableSessions({ query } as unknown as EntityManager, table, 't1'),
    ).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledTimes(6);
    expect(query.mock.calls.map(([sql]) => sql)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('UPDATE session_evaluation_configs'),
        expect.stringContaining('DELETE FROM session_evaluation_criteria'),
        expect.stringContaining('INSERT INTO session_evaluation_criteria'),
        expect.stringContaining('DELETE FROM evaluation_items'),
        expect.stringContaining('grade_recalculation_history'),
      ]),
    );
    expect(query).toHaveBeenLastCalledWith(expect.stringContaining('grade_recalculation_history'), [
      'pt1',
      't1',
    ]);
  });

  it('blocks propagation if submitted evaluations would lose criteria', async () => {
    const query = jest
      .fn<Promise<unknown[]>, [string, unknown[]]>()
      .mockResolvedValueOnce([{ exists: true }]);
    await expect(
      propagatePerformanceTableSessions({ query } as unknown as EntityManager, table, 't1'),
    ).rejects.toThrow(
      new ConflictError(
        'Não é possível propagar critérios adicionados ou removidos para avaliações já enviadas. Preserve os critérios dessas avaliações.',
      ),
    );
    expect(query).toHaveBeenCalledTimes(1);
  });
});
