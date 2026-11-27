import { lockSessionPerformanceTable } from './session-table-lock.persistence';
import { readTableEditContext } from './session-table-editing.reads';
import { persistSessionTableEdit } from './session-table-editing.persistence';
import { PgSessionTableEditingRepository } from './pg-session-table-editing.repository';

jest.mock('./session-table-lock.persistence', () => ({ lockSessionPerformanceTable: jest.fn() }));
jest.mock('./session-table-editing.reads', () => ({ readTableEditContext: jest.fn() }));
jest.mock('./session-table-editing.persistence', () => ({ persistSessionTableEdit: jest.fn() }));

describe('PgSessionTableEditingRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads the editing context inside a repeatable-read transaction', async () => {
    const manager = { query: jest.fn() };
    const context = { table: { id: 'table-1' }, session: { sessionId: 'session-1' }, sessions: [] };
    const transaction = jest.fn((...args: unknown[]) => {
      const work = args.at(-1) as (tx: typeof manager) => unknown;
      return work(manager);
    });
    jest.mocked(readTableEditContext).mockResolvedValue(context as never);
    const repository = new PgSessionTableEditingRepository({ transaction } as never);

    await expect(repository.getContext('session-1', 'tutor-1')).resolves.toBe(context);
    expect(transaction).toHaveBeenCalledWith('REPEATABLE READ', expect.any(Function));
    expect(readTableEditContext).toHaveBeenCalledWith(manager, 'session-1', 'tutor-1');
  });

  it('locks the table and sessions before preparing and persisting an edit', async () => {
    const manager = { query: jest.fn().mockResolvedValue([]) };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    const context = { table: { id: 'table-1' }, session: { sessionId: 'session-1' }, sessions: [] };
    const plan = { table: { id: 'table-1' }, sessions: [], copy: false };
    const result = { table: { id: 'table-1', name: 'Nova' }, sessions: [] };
    const prepare = jest.fn().mockReturnValue(plan);
    jest.mocked(lockSessionPerformanceTable).mockResolvedValue('table-1');
    jest.mocked(readTableEditContext).mockResolvedValue(context as never);
    jest.mocked(persistSessionTableEdit).mockResolvedValue(result);
    const repository = new PgSessionTableEditingRepository({ transaction } as never);

    await expect(
      repository.edit({ sessionId: 'session-1', tutorId: 'tutor-1' } as never, prepare),
    ).resolves.toBe(result);
    expect(lockSessionPerformanceTable).toHaveBeenCalledWith(manager, 'session-1', true);
    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('FOR UPDATE'), [
      'table-1',
      'session-1',
    ]);
    expect(readTableEditContext).toHaveBeenCalledWith(manager, 'session-1', 'tutor-1');
    expect(prepare).toHaveBeenCalledWith(context);
    expect(persistSessionTableEdit).toHaveBeenCalledWith(manager, plan);
  });
});
