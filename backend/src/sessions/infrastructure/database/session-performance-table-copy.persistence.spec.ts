import type { EntityManager } from 'typeorm';
import { NotFoundError } from '@/shared/errors/application.error';
import { createSessionPerformanceTableCopy } from './session-performance-table-copy.persistence';

describe('createSessionPerformanceTableCopy', () => {
  it('copies the table and its active criteria in order', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'copy-1', name: 'Barema', isDefault: false }])
      .mockResolvedValueOnce([]);
    const manager = { query } as unknown as EntityManager;

    await expect(
      createSessionPerformanceTableCopy(manager, 'source-1', 'room-1', 'tutor-1'),
    ).resolves.toEqual({ id: 'copy-1', name: 'Barema', isDefault: false });

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('COALESCE(tutor_id, $3::uuid)'),
      ['source-1', 'room-1', 'tutor-1'],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('ORDER BY order_index, created_at, id'),
      ['source-1', 'copy-1'],
    );
  });

  it('throws when the source performance table does not exist', async () => {
    const query = jest.fn().mockResolvedValueOnce([]);
    const manager = { query } as unknown as EntityManager;

    await expect(
      createSessionPerformanceTableCopy(manager, 'missing', 'room-1', 'tutor-1'),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
