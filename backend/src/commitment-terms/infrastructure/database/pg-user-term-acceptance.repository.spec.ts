import type { EntityManager, Repository } from 'typeorm';
import { ConflictError } from '@/shared/errors/application.error';
import { UserTermAcceptance } from '../../domain/entities/user-term-acceptance.entity';
import { PgUserTermAcceptanceRepository } from './pg-user-term-acceptance.repository';

const callArgument = (calls: unknown[][], call: number, argument: number): unknown =>
  calls[call]![argument];

describe('PgUserTermAcceptanceRepository', () => {
  const acceptance = UserTermAcceptance.create({
    userId: 'user-1',
    termId: 'term-1',
    termVersion: '1.2',
  });
  const row = {
    id: 'acceptance-1',
    userId: 'user-1',
    termId: 'term-1',
    termVersion: '1.2',
    acceptedAt: new Date('2026-10-01T00:00:00.000Z'),
  };

  const createSubject = () => {
    const manager = { query: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    const repository = {
      query: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      manager: {
        transaction: jest.fn(async (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager as unknown as EntityManager),
        ),
      },
    };
    return {
      manager,
      repository,
      subject: new PgUserTermAcceptanceRepository(
        repository as unknown as Repository<UserTermAcceptance>,
      ),
    };
  };

  it('finds the latest acceptance and an acceptance for a specific term', async () => {
    const { repository, subject } = createSubject();
    repository.query
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([]);

    await expect(subject.findByUserId('user-1')).resolves.toMatchObject(row);
    await expect(subject.findByUserId('user-2')).resolves.toBeNull();
    await expect(subject.findByUserIdAndTermId('user-1', 'term-1')).resolves.toMatchObject(row);
    await expect(subject.findByUserIdAndTermId('user-2', 'term-1')).resolves.toBeNull();
    expect(callArgument(repository.query.mock.calls as unknown[][], 0, 0) as string).toContain(
      'ORDER BY accepted_at DESC, id DESC',
    );
    expect(callArgument(repository.query.mock.calls as unknown[][], 2, 1)).toEqual([
      'user-1',
      'term-1',
    ]);
  });

  it('reports whether the user accepted the current term', async () => {
    const { repository, subject } = createSubject();
    repository.query
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([{ exists: false }])
      .mockResolvedValueOnce([]);

    await expect(subject.hasAccepted('user-1')).resolves.toBe(true);
    await expect(subject.hasAccepted('user-1')).resolves.toBe(false);
    await expect(subject.hasAccepted('user-1')).resolves.toBe(false);
  });

  it('inserts an acceptance only after locking the current version', async () => {
    const { manager, subject } = createSubject();
    manager.query.mockResolvedValueOnce([{ id: 'term-1' }]).mockResolvedValueOnce([row]);

    await expect(subject.create(acceptance)).resolves.toMatchObject(row);
    const queryCalls = manager.query.mock.calls as unknown[][];
    expect(callArgument(queryCalls, 0, 0) as string).toContain('FOR SHARE');
    expect(callArgument(queryCalls, 0, 1)).toEqual(['term-1', '1.2']);
    expect(callArgument(queryCalls, 1, 0) as string).toContain(
      'ON CONFLICT (user_id, term_id) DO NOTHING',
    );
    expect(callArgument(queryCalls, 1, 1)).toEqual(['user-1', 'term-1', '1.2']);
  });

  it('returns the existing acceptance after a duplicate insert', async () => {
    const { manager, subject } = createSubject();
    manager.query
      .mockResolvedValueOnce([{ id: 'term-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([row]);

    await expect(subject.create(acceptance)).resolves.toMatchObject(row);
    expect(callArgument(manager.query.mock.calls as unknown[][], 2, 0) as string).toContain(
      'WHERE user_id = $1 AND term_id = $2',
    );
  });

  it('fails if the accepted version is no longer current', async () => {
    const { manager, subject } = createSubject();
    manager.query.mockResolvedValueOnce([]);

    await expect(subject.create(acceptance)).rejects.toBeInstanceOf(ConflictError);
    expect(manager.query).toHaveBeenCalledTimes(1);
  });

  it('fails if a duplicate is reported but no saved acceptance can be found', async () => {
    const { manager, subject } = createSubject();
    manager.query
      .mockResolvedValueOnce([{ id: 'term-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await expect(subject.create(acceptance)).rejects.toThrow(
      'Falha ao registrar aceite do termo de compromisso.',
    );
  });
});
