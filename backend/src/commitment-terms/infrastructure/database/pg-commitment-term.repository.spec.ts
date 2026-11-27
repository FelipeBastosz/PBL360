import type { Repository } from 'typeorm';
import { CommitmentTerm } from '../../domain/entities/commitment-term.entity';
import { PgCommitmentTermRepository } from './pg-commitment-term.repository';

const callArgument = (calls: unknown[][], call: number, argument: number): unknown =>
  calls[call]![argument];

describe('PgCommitmentTermRepository', () => {
  const createSubject = () => {
    const repository = {
      query: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    return {
      repository,
      subject: new PgCommitmentTermRepository(repository as unknown as Repository<CommitmentTerm>),
    };
  };

  const row = {
    id: 'term-1',
    version: '1.2',
    title: 'Termo vigente',
    content: 'Conteúdo preservado',
    isCurrent: true,
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
  };

  it('returns the current term as a domain entity or null', async () => {
    const { repository, subject } = createSubject();
    repository.query.mockResolvedValueOnce([row]).mockResolvedValueOnce([]);

    const current = await subject.findCurrent();
    expect(current).toBeInstanceOf(CommitmentTerm);
    expect(current).toMatchObject(row);
    await expect(subject.findCurrent()).resolves.toBeNull();
    expect(callArgument(repository.query.mock.calls as unknown[][], 0, 0) as string).toContain(
      'WHERE is_current = TRUE',
    );
  });

  it('finds a term by version and returns null when it is unknown', async () => {
    const { repository, subject } = createSubject();
    repository.query.mockResolvedValueOnce([row]).mockResolvedValueOnce([]);

    await expect(subject.findByVersion('1.2')).resolves.toMatchObject(row);
    await expect(subject.findByVersion('9.9')).resolves.toBeNull();
    expect(callArgument(repository.query.mock.calls as unknown[][], 0, 1)).toEqual(['1.2']);
    expect(callArgument(repository.query.mock.calls as unknown[][], 0, 0) as string).toContain(
      'WHERE version = $1',
    );
  });
});
