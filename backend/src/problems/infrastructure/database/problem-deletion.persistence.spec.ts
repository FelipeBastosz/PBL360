import type { EntityManager } from 'typeorm';
import { ConflictError } from '@/shared/errors/application.error';
import { deleteProblemTransactionally } from './problem-deletion.persistence';

describe('deleteProblemTransactionally', () => {
  it('returns without deleting when the problem is absent from the room', async () => {
    const query = jest.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce([]);
    await expect(
      deleteProblemTransactionally({ query } as unknown as EntityManager, 'p1', 'r1'),
    ).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('deletes the problem and compacts subsequent order indexes', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ orderIndex: '2' }])
      .mockResolvedValueOnce([{ sessions: 0, grades: 0, feedbacks: 0, evaluations: 0 }]);
    await deleteProblemTransactionally({ query } as unknown as EntityManager, 'p1', 'r1');
    expect(query).toHaveBeenCalledTimes(5);
    expect(query).toHaveBeenNthCalledWith(4, expect.stringContaining('DELETE FROM problems'), [
      'p1',
      'r1',
    ]);
    expect(query).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('order_index = order_index - 1'),
      ['r1', 2],
    );
  });

  it('preserves the problem when linked records prevent deletion', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ orderIndex: 1 }])
      .mockResolvedValueOnce([{ sessions: 1, grades: 0, feedbacks: 0, evaluations: 0 }]);
    await expect(
      deleteProblemTransactionally({ query } as unknown as EntityManager, 'p1', 'r1'),
    ).rejects.toThrow(
      new ConflictError('O problema não pode ser excluído pois possui registros vinculados.'),
    );
    expect(query).toHaveBeenCalledTimes(3);
  });
});
