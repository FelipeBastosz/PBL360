import { readProblemDeletionImpact } from './problem-deletion-impact.queries';
import { deleteProblemTransactionally } from './problem-deletion.persistence';
import { updateProblemDetails } from './problem-update.persistence';
import { PgProblemRepository } from './pg-problem.repository';

jest.mock('./problem-deletion-impact.queries', () => ({ readProblemDeletionImpact: jest.fn() }));
jest.mock('./problem-deletion.persistence', () => ({ deleteProblemTransactionally: jest.fn() }));
jest.mock('./problem-update.persistence', () => ({ updateProblemDetails: jest.fn() }));

describe('PgProblemRepository', () => {
  const row = {
    id: 'problem-1',
    roomId: 'room-1',
    title: 'Problema',
    description: null,
    orderIndex: '2',
    startDate: '2026-01-01',
    endDate: null,
    selfEvalReleased: false,
    peerEvalReleased: false,
    releasedAt: null,
    selfEvalDeadline: null,
    createdBy: 'teacher-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: null,
  };

  it('finds a problem and lists sessions, returning null when not found', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'session-1', title: 'Sessão 1' }]);
    const repository = new PgProblemRepository({ query, manager: { query: jest.fn() } } as never);

    await expect(repository.findById('problem-1')).resolves.toMatchObject({
      id: 'problem-1',
      orderIndex: 2,
    });
    await expect(repository.findById('missing')).resolves.toBeNull();
    await expect(repository.listSessions('problem-1')).resolves.toEqual([
      { id: 'session-1', title: 'Sessão 1' },
    ]);
  });

  it('lists problem entities and checks and counts sessions with safe defaults', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([{ count: '3' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const repository = new PgProblemRepository({ query, manager: { query: jest.fn() } } as never);

    await expect(repository.findByRoomId('room-1')).resolves.toMatchObject([
      { id: 'problem-1', orderIndex: 2 },
    ]);
    await expect(repository.hasSessions('problem-1')).resolves.toBe(true);
    await expect(repository.countSessions('problem-1')).resolves.toBe(3);
    await expect(repository.hasSessions('empty')).resolves.toBe(false);
    await expect(repository.countSessions('empty')).resolves.toBe(0);
  });

  it('delegates deletion impact and transactionally updates problem details', async () => {
    const managerQuery = jest.fn().mockResolvedValue([row]);
    const manager = { query: managerQuery };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    const result = { ...row, orderIndex: 2 };
    jest.mocked(readProblemDeletionImpact).mockResolvedValue({} as never);
    jest.mocked(updateProblemDetails).mockResolvedValue(undefined);
    const repository = new PgProblemRepository({
      query: jest.fn(),
      manager: { transaction, query: jest.fn() },
    } as never);
    await expect(repository.getDeletionImpact('problem-1')).resolves.toEqual({});
    expect(readProblemDeletionImpact).toHaveBeenCalled();
    const updateRepo = new PgProblemRepository({ manager: { transaction } } as never);
    await expect(updateRepo.updateDetails({ id: 'problem-1' } as never)).resolves.toMatchObject(
      result,
    );
    expect(updateProblemDetails).toHaveBeenCalledWith(manager, { id: 'problem-1' });
  });

  it('creates rows in the next order and rejects missing insert results', async () => {
    const managerQuery = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([row]);
    const manager = { query: managerQuery };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    const repository = new PgProblemRepository({ manager: { transaction } } as never);

    await expect(
      repository.create({ roomId: 'room-1', title: 'Problema', createdBy: 'teacher-1' } as never),
    ).resolves.toMatchObject({
      id: 'problem-1',
      orderIndex: 2,
    });
    const missingRepo = new PgProblemRepository({
      manager: {
        transaction: (work: (tx: { query: jest.Mock }) => unknown) =>
          work({ query: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]) }),
      },
    } as never);
    await expect(missingRepo.create({} as never)).rejects.toThrow('Failed to persist problem.');
  });

  it('delegates deletion to the transaction helper', async () => {
    const manager = { query: jest.fn() };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    jest.mocked(deleteProblemTransactionally).mockResolvedValue(undefined);
    const repository = new PgProblemRepository({ manager: { transaction } } as never);

    await repository.delete('problem-1', 'room-1');
    expect(deleteProblemTransactionally).toHaveBeenCalledWith(manager, 'problem-1', 'room-1');
  });
});
