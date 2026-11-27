import type { EntityManager } from 'typeorm';
import { lockPerformanceTableSessions } from './performance-table-lock.persistence';

describe('lockPerformanceTableSessions', () => {
  it('locks all sessions using the performance table in a stable order', async () => {
    const manager = { query: jest.fn().mockResolvedValue([]) } as unknown as EntityManager;

    await lockPerformanceTableSessions(manager, 'table-1');

    expect(manager.query).toHaveBeenCalledWith(
      'SELECT id FROM sessions WHERE performance_table_id = $1 ORDER BY id FOR UPDATE;',
      ['table-1'],
    );
  });
});
