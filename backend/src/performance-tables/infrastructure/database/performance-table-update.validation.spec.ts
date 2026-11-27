import type { EntityManager } from 'typeorm';
import { InvalidPerformanceTableError } from '../../domain/errors/invalid-performance-table.error';
import { assertPastSessionUpdateAllowed } from './performance-table-update.validation';

describe('assertPastSessionUpdateAllowed', () => {
  const table = (overrides: Record<string, unknown> = {}) => ({
    id: 'pt1',
    name: 'Barema',
    description: null,
    criteria: [{ id: 'c1', name: 'Presença', description: null, orderIndex: 1, weight: 4 }],
    ...overrides,
  });

  it('allows updates when no session used the table in the past', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ pastSessionCount: 0 }]);
    await expect(
      assertPastSessionUpdateAllowed({ query } as unknown as EntityManager, table() as never),
    ).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('allows weight-only edits on tables used in past sessions', async () => {
    const row = {
      id: 'pt1',
      tutorId: 't1',
      name: 'Barema',
      description: null,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      problemCount: 1,
      criterionId: 'c1',
      criterionName: 'Presença',
      criterionDescription: null,
      criterionOrderIndex: 1,
      criterionWeight: '2',
    };
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ pastSessionCount: 1 }])
      .mockResolvedValueOnce([row]);
    await expect(
      assertPastSessionUpdateAllowed(
        { query } as unknown as EntityManager,
        table({
          criteria: [{ id: 'c1', name: 'Presença', description: null, orderIndex: 1, weight: 4 }],
        }) as never,
      ),
    ).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledTimes(3);
  });

  it('rejects metadata edits after a past session', async () => {
    const row = {
      id: 'pt1',
      tutorId: 't1',
      name: 'Barema',
      description: null,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      problemCount: 1,
      criterionId: null,
      criterionName: null,
      criterionDescription: null,
      criterionOrderIndex: null,
      criterionWeight: null,
    };
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ pastSessionCount: 1 }])
      .mockResolvedValueOnce([row]);
    await expect(
      assertPastSessionUpdateAllowed(
        { query } as unknown as EntityManager,
        table({ name: 'Renomeada', criteria: [] }) as never,
      ),
    ).rejects.toThrow(
      new InvalidPerformanceTableError(
        'Esta tabela já foi usada em sessão passada. Somente os pesos podem ser alterados.',
      ),
    );
  });
});
