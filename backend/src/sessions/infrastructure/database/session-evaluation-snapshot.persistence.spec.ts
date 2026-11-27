import type { EntityManager } from 'typeorm';
import {
  removeObsoleteDraftItems,
  replaceSessionSnapshot,
} from './session-evaluation-snapshot.persistence';

describe('session evaluation snapshot persistence', () => {
  it('replaces the table snapshot and copies active criteria in order', async () => {
    const manager = { query: jest.fn().mockResolvedValue([]) } as unknown as EntityManager;

    await replaceSessionSnapshot(manager, 'session-1', {
      id: 'table-1',
      name: 'Tabela',
      isDefault: false,
    });

    expect(manager.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('UPDATE session_evaluation_configs'),
      ['session-1', 'table-1', 'Tabela'],
    );
    expect(manager.query).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM session_evaluation_criteria WHERE session_id = $1;',
      ['session-1'],
    );
    expect(manager.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO session_evaluation_criteria'),
      ['session-1', 'table-1'],
    );
  });

  it('removes obsolete items only from draft evaluations', async () => {
    const query = jest.fn<Promise<unknown[]>, [string, unknown[]?]>().mockResolvedValue([]);
    await removeObsoleteDraftItems({ query } as unknown as EntityManager, 'session-1');

    expect(query).toHaveBeenCalledWith(expect.stringContaining("e.status = 'DRAFT'"), [
      'session-1',
    ]);
    expect(query.mock.calls[0][0]).toContain('NOT EXISTS');
  });
});
