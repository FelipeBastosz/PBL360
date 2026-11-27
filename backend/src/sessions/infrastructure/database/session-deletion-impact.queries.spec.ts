import type { EntityManager } from 'typeorm';
import { readSessionDeletionImpact } from './session-deletion-impact.queries';

describe('readSessionDeletionImpact', () => {
  it('returns the queried impact for the session', async () => {
    const impact = {
      chamada: 1,
      papeis: 2,
      observacoes: 3,
      avaliacoes: 4,
      feedbacks: 5,
      avaliacaoGeral: 6,
    };
    const query = jest.fn().mockResolvedValue([impact]);
    await expect(
      readSessionDeletionImpact({ query } as unknown as EntityManager, 's1'),
    ).resolves.toBe(impact);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('session_general_evaluations'), [
      's1',
    ]);
  });

  it('throws when no impact row is returned', async () => {
    const query = jest.fn().mockResolvedValue([]);
    await expect(
      readSessionDeletionImpact({ query } as unknown as EntityManager, 's1'),
    ).rejects.toThrow('Failed to read session deletion impact.');
  });
});
