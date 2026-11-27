import type { EntityManager } from 'typeorm';
import { NotFoundError } from '@/shared/errors/application.error';
import { updateProblemDetails } from './problem-update.persistence';

describe('updateProblemDetails', () => {
  const input = { id: 'p1', roomId: 'r1', title: 'Novo título', authorId: 't1' };

  it('locks and updates the problem when it belongs to the room', async () => {
    const query = jest.fn().mockResolvedValueOnce([{ id: 'p1' }]);
    await expect(
      updateProblemDetails({ query } as unknown as EntityManager, input),
    ).resolves.toBeUndefined();
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining('FOR UPDATE'), ['p1', 'r1']);
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE problems'), [
      'p1',
      'Novo título',
      't1',
    ]);
  });

  it('throws when the problem does not belong to the room', async () => {
    const query = jest.fn().mockResolvedValue([]);
    await expect(
      updateProblemDetails({ query } as unknown as EntityManager, input),
    ).rejects.toThrow(new NotFoundError('Problema não encontrado.'));
    expect(query).toHaveBeenCalledTimes(1);
  });
});
