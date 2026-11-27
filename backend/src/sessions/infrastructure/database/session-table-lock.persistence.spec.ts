import type { EntityManager } from 'typeorm';
import { ConflictError, NotFoundError } from '@/shared/errors/application.error';
import {
  lockProblemPerformanceTables,
  lockSessionPerformanceTable,
} from './session-table-lock.persistence';

describe('session table locks', () => {
  it('locks the current performance table for sharing by default', async () => {
    const query = jest
      .fn<Promise<unknown[]>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ id: 'table-1' }])
      .mockResolvedValueOnce([{ tableId: 'table-1' }]);

    await expect(
      lockSessionPerformanceTable({ query } as unknown as EntityManager, 'session-1'),
    ).resolves.toBe('table-1');
    expect(query.mock.calls[0][0]).toContain('FOR SHARE OF pt');
    expect(query.mock.calls[1][1]).toEqual(['session-1']);
  });

  it('uses an exclusive lock when requested', async () => {
    const query = jest
      .fn<Promise<unknown[]>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ id: 'table-1' }])
      .mockResolvedValueOnce([{ tableId: 'table-1' }]);

    await lockSessionPerformanceTable({ query } as unknown as EntityManager, 'session-1', true);
    expect(query.mock.calls[0][0]).toContain('FOR UPDATE OF pt');
  });

  it('rejects a session without an active performance table', async () => {
    const query = jest.fn().mockResolvedValueOnce([]);
    await expect(
      lockSessionPerformanceTable({ query } as unknown as EntityManager, 'session-1'),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('rejects a table that changed after the lock was acquired', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'table-1' }])
      .mockResolvedValueOnce([{ tableId: 'table-2' }]);
    await expect(
      lockSessionPerformanceTable({ query } as unknown as EntityManager, 'session-1'),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('locks the target and currently used performance tables in deterministic order', async () => {
    const query = jest.fn().mockResolvedValue([]);
    await lockProblemPerformanceTables(
      { query } as unknown as EntityManager,
      'problem-1',
      'table-2',
    );
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY id FOR SHARE'), [
      'problem-1',
      'table-2',
    ]);
  });
});
