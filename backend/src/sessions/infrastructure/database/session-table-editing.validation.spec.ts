import type { EntityManager } from 'typeorm';
import { ConflictError } from '@/shared/errors/application.error';
import { assertTutorItemsRemainValid } from './session-table-editing.validation';

describe('assertTutorItemsRemainValid', () => {
  const plan = {
    table: { criteria: [{ id: 'c1' }, { id: undefined }, { id: 'c2' }] },
    sessions: [{ sessionId: 's1' }, { sessionId: 's2' }],
  } as never;

  it('passes when submitted evaluations remain compatible', async () => {
    const query = jest.fn().mockResolvedValue([{ incompatible: false }]);
    await expect(
      assertTutorItemsRemainValid({ query } as unknown as EntityManager, plan),
    ).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledWith(expect.stringContaining('evaluation_items'), [
      ['s1', 's2'],
      ['c1', 'c2'],
    ]);
  });

  it('rejects edits that would invalidate submitted tutor items', async () => {
    const query = jest.fn().mockResolvedValue([{ incompatible: true }]);
    await expect(
      assertTutorItemsRemainValid({ query } as unknown as EntityManager, plan),
    ).rejects.toThrow(
      new ConflictError(
        'A configuração da tabela diverge das avaliações enviadas. Preserve os critérios dessas avaliações.',
      ),
    );
  });

  it('accepts an empty result from the compatibility query', async () => {
    const query = jest.fn().mockResolvedValue([]);
    await expect(
      assertTutorItemsRemainValid({ query } as unknown as EntityManager, plan),
    ).resolves.toBeUndefined();
  });
});
