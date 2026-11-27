import type { EntityManager } from 'typeorm';
import { countReleaseSubmissions } from './evaluation-release.queries';

describe('countReleaseSubmissions', () => {
  it('returns database counts for a session', async () => {
    const row = {
      rollCallSaved: true,
      presentStudents: 4,
      selfSubmitted: 2,
      peerSubmitted: 3,
      tutorSubmitted: 1,
      pokerStarted: true,
    };
    const query = jest.fn().mockResolvedValue([row]);
    await expect(
      countReleaseSubmissions({ query } as unknown as EntityManager, 's1'),
    ).resolves.toBe(row);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('COUNT(DISTINCT evaluator_id)'), [
      's1',
    ]);
  });

  it('returns defaults when no aggregate row is returned', async () => {
    const query = jest.fn().mockResolvedValue([]);
    await expect(
      countReleaseSubmissions({ query } as unknown as EntityManager, 's1'),
    ).resolves.toEqual({
      rollCallSaved: false,
      presentStudents: 0,
      selfSubmitted: 0,
      peerSubmitted: 0,
      tutorSubmitted: 0,
      pokerStarted: false,
    });
  });
});
