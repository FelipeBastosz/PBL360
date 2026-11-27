import { persistTableUpdate } from './performance-table-update.persistence';
import { PgPerformanceTableRepository } from './pg-performance-table.repository';

jest.mock('./performance-table-update.persistence', () => ({ persistTableUpdate: jest.fn() }));

describe('PgPerformanceTableRepository', () => {
  const detail = {
    id: 'table-1',
    tutorId: 'tutor-1',
    roomId: 'room-1',
    name: 'Tabela',
    description: null,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    problemCount: '1',
    criterionId: 'criterion-1',
    criterionName: 'Critério',
    criterionDescription: null,
    criterionOrderIndex: 1,
    criterionWeight: '10',
  };

  it('creates a table and assigns persisted criterion ids', async () => {
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'table-1', tutorId: 'tutor-1', name: 'Tabela' }])
        .mockResolvedValueOnce([{ id: 'criterion-1' }]),
    };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    const repository = new PgPerformanceTableRepository({ manager: { transaction } } as never);
    const table = {
      tutorId: 'tutor-1',
      roomId: 'room-1',
      name: 'Tabela',
      description: null,
      isDefault: false,
      criteria: [{ name: 'Critério', description: null, orderIndex: 1, weight: 10 }],
    };

    await expect(repository.create(table as never)).resolves.toMatchObject({
      id: 'table-1',
      criteria: [{ id: 'criterion-1', performanceTableId: 'table-1' }],
    });
    expect(manager.query).toHaveBeenCalledTimes(2);
    expect(manager.query).toHaveBeenNthCalledWith(2, expect.any(String), [
      'table-1',
      'Critério',
      null,
      1,
      10,
    ]);
  });

  it('fails if table insertion returns no row', async () => {
    const transaction = jest.fn((work: (tx: { query: jest.Mock }) => unknown) =>
      work({ query: jest.fn().mockResolvedValue([]) }),
    );
    const repository = new PgPerformanceTableRepository({ manager: { transaction } } as never);

    await expect(repository.create({} as never)).rejects.toThrow(
      'Failed to persist performance table.',
    );
  });

  it('updates through persistence helper and reloads the updated detail', async () => {
    const manager = { query: jest.fn().mockResolvedValue([detail]) };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    jest.mocked(persistTableUpdate).mockResolvedValue(undefined);
    const repository = new PgPerformanceTableRepository({ manager: { transaction } } as never);

    await expect(
      repository.update({ id: 'table-1', tutorId: 'tutor-1' } as never, true, 'tutor-1'),
    ).resolves.toMatchObject({
      id: 'table-1',
      criteria: [{ id: 'criterion-1', weight: 10 }],
    });
    expect(persistTableUpdate).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({ id: 'table-1' }),
      true,
      'tutor-1',
    );
    expect(() => repository.update({ id: 'table-1', tutorId: null } as never)).toThrow(
      'O professor responsável é obrigatório.',
    );
  });

  it('soft deletes only eligible rows and lists summaries and room table items', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'table-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ problemCount: '2', sessionCount: '3', pastSessionCount: '1' }])
      .mockResolvedValueOnce([{ problemCount: null, sessionCount: null, pastSessionCount: null }])
      .mockResolvedValueOnce([detail])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const repository = new PgPerformanceTableRepository({
      query,
      manager: { query: jest.fn() },
    } as never);
    const table = { id: 'table-1', deletedAt: new Date(), tutorId: 'tutor-1' };

    await expect(repository.softDelete(table as never)).resolves.toBe(true);
    await expect(repository.softDelete(table as never)).resolves.toBe(false);
    await repository.findSummariesByTutorId('tutor-1');
    await expect(repository.findUsageById('table-1')).resolves.toEqual({
      problemCount: 2,
      sessionCount: 3,
      pastSessionCount: 1,
    });
    await expect(repository.findUsageById('missing')).resolves.toEqual({
      problemCount: 0,
      sessionCount: 0,
      pastSessionCount: 0,
    });
    await expect(repository.findById('table-1')).resolves.toMatchObject({ id: 'table-1' });
    await expect(repository.findById('missing')).resolves.toBeNull();
    await expect(repository.findByIdIncludingDeleted('missing')).resolves.toBeNull();
    await expect(repository.findTablesByRoom('room-1', 'tutor-1')).resolves.toEqual([]);
    expect(query).toHaveBeenCalledTimes(9);
  });
});
