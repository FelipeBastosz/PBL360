import { lockProblemPerformanceTables } from './session-table-lock.persistence';
import { reapplyDefaultSessionTables } from './default-session-tables.persistence';
import { assertSessionCanBeDeleted } from '../../domain/services/session-deletion-policy';
import { readSessionDeletionImpact } from './session-deletion-impact.queries';
import { countReleaseSubmissions } from './evaluation-release.queries';
import { PgSessionRepository } from './pg-session.repository';

jest.mock('./session-table-lock.persistence', () => ({ lockProblemPerformanceTables: jest.fn() }));
jest.mock('./default-session-tables.persistence', () => ({
  reapplyDefaultSessionTables: jest.fn(),
}));
jest.mock('../../domain/services/session-deletion-policy', () => ({
  assertSessionCanBeDeleted: jest.fn(),
}));
jest.mock('./session-deletion-impact.queries', () => ({ readSessionDeletionImpact: jest.fn() }));
jest.mock('./evaluation-release.queries', () => ({ countReleaseSubmissions: jest.fn() }));

describe('PgSessionRepository', () => {
  const row = {
    id: 'session-1',
    problemId: 'problem-1',
    performanceTableId: 'table-1',
    usesDefaultTable: false,
    title: 'Sessão 1',
    description: null,
    date: '2026-01-01',
    orderIndex: '2',
    status: 'agendada',
    selfEvalReleased: false,
    peerEvalReleased: false,
    selfEvalDeadline: null,
    peerEvalDeadline: null,
    releasedAt: null,
    releasedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('finds a session by id and lists sessions for a problem', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([row]);
    const repository = new PgSessionRepository({ query, manager: { query: jest.fn() } } as never);

    await expect(repository.findById('session-1')).resolves.toMatchObject({
      id: 'session-1',
      orderIndex: 2,
    });
    await expect(repository.findById('missing')).resolves.toBeNull();
    await expect(repository.findByProblemId('problem-1')).resolves.toMatchObject([
      { id: 'session-1', orderIndex: 2 },
    ]);
  });

  it('creates within a transaction and re-applies default tables', async () => {
    const manager = { query: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([row]) };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    const repository = new PgSessionRepository({ manager: { transaction } } as never);

    await expect(repository.create({ problemId: 'problem-1' } as never)).resolves.toMatchObject({
      id: 'session-1',
    });
    expect(lockProblemPerformanceTables).toHaveBeenCalledWith(
      manager,
      'problem-1',
      expect.any(String),
    );
    expect(manager.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO sessions'),
      expect.any(Array),
    );
    expect(reapplyDefaultSessionTables).toHaveBeenCalledWith(manager, 'problem-1');
  });

  it('saves the session, clears default table fields, and reloads its persisted form', async () => {
    const manager = {
      query: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([row]),
      save: jest.fn(),
    };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    const repository = new PgSessionRepository({ manager: { transaction } } as never);
    const session = { ...row, id: 'session-1' };

    await expect(repository.save(session as never)).resolves.toMatchObject({
      id: 'session-1',
      orderIndex: 2,
    });
    expect(manager.save).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        performanceTableId: undefined,
        usesDefaultTable: undefined,
      }),
    );
    expect(reapplyDefaultSessionTables).toHaveBeenCalledWith(manager, 'problem-1');
  });

  it('delegates deletion impact and release submission count', async () => {
    const manager = { query: jest.fn(), transaction: jest.fn() };
    const repository = new PgSessionRepository({ manager } as never);
    jest.mocked(readSessionDeletionImpact).mockResolvedValue({} as never);
    jest.mocked(countReleaseSubmissions).mockResolvedValue({} as never);

    await expect(repository.getDeletionImpact('session-1')).resolves.toEqual({});
    await expect(repository.countReleaseSubmissions('session-1')).resolves.toEqual({});
    expect(readSessionDeletionImpact).toHaveBeenCalledWith(manager, 'session-1');
    expect(countReleaseSubmissions).toHaveBeenCalledWith(manager, 'session-1');
  });

  it('skips deletion for missing targets and deletes existing sessions while compacting order', async () => {
    const manager = { query: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]) };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    const repository = new PgSessionRepository({ manager: { transaction } } as never);
    await repository.delete('missing', 'problem-1');
    expect(readSessionDeletionImpact).not.toHaveBeenCalled();

    manager.query
      .mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ orderIndex: '2' }])
      .mockResolvedValue([]);
    jest.mocked(readSessionDeletionImpact).mockResolvedValue({} as never);
    await repository.delete('session-1', 'problem-1');
    expect(assertSessionCanBeDeleted).toHaveBeenCalled();
    expect(
      manager.query.mock.calls.some(([sql]: [string]) => sql.includes('DELETE FROM sessions')),
    ).toBe(true);
    expect(
      manager.query.mock.calls.some(([sql]: [string]) =>
        sql.includes('order_index = -order_index'),
      ),
    ).toBe(true);
    expect(
      manager.query.mock.calls.some(([sql]: [string]) =>
        sql.includes('order_index = -order_index - 1'),
      ),
    ).toBe(true);
    expect(reapplyDefaultSessionTables).toHaveBeenCalledWith(manager, 'problem-1');
  });
});
