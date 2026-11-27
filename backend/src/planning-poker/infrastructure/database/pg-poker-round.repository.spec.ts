import { PgPokerRoundRepository } from './pg-poker-round.repository';
import { PokerRoundStatus } from '../../domain/entities/poker-round';
import { QueryFailedError } from 'typeorm';

describe('PgPokerRoundRepository', () => {
  const votingRow = {
    id: 'round-1',
    pokerId: 'poker-1',
    studentId: 'student-1',
    number: '2',
    status: PokerRoundStatus.VOTING,
    seats: [{ seat: 1, studentId: 'student-1' }],
    average: null,
    finalGrade: null,
    adjusted: false,
    justification: null,
    decidedBy: null,
    decidedAt: null,
  };

  it('finds open, by id, last, and decided rounds, mapping numeric numbers and decisions', async () => {
    const decided = {
      ...votingRow,
      status: PokerRoundStatus.DECIDED,
      finalGrade: 8.5,
      adjusted: true,
      justification: 'Revisado',
      decidedBy: 'teacher-1',
      decidedAt: new Date(),
    };
    const query = jest
      .fn()
      .mockResolvedValueOnce([votingRow])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([votingRow])
      .mockResolvedValueOnce([decided]);
    const repository = new PgPokerRoundRepository({ query } as never);

    await expect(repository.findOpen('poker-1')).resolves.toMatchObject({
      number: 2,
      decision: null,
    });
    await expect(repository.findById('poker-1', 'missing')).resolves.toBeNull();
    await expect(repository.findLast('poker-1')).resolves.toMatchObject({ id: 'round-1' });
    await expect(repository.findDecided('poker-1')).resolves.toMatchObject([
      { number: 2, decision: { finalGrade: 8.5, adjusted: true, justification: 'Revisado' } },
    ]);
  });

  it('opens rounds and maps unique constraint errors', async () => {
    const manager = {
      query: jest.fn().mockResolvedValueOnce([votingRow]).mockResolvedValueOnce([]),
    };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    const repository = new PgPokerRoundRepository({ transaction } as never);
    const newRound = { pokerId: 'poker-1', studentId: 'student-1', number: 2, seats: [] };
    await expect(repository.open(newRound, ['student-1'])).resolves.toMatchObject({
      id: 'round-1',
    });
    expect(manager.query).toHaveBeenCalledTimes(2);

    const conflict = new QueryFailedError('insert', [], {
      code: '23505',
      constraint: 'uq_poker_rounds_open',
    });
    const conflictRepo = new PgPokerRoundRepository({
      transaction: jest.fn().mockRejectedValue(conflict),
    } as never);
    await expect(conflictRepo.open(newRound, [])).rejects.toThrow(
      'Há uma rodada aberta ainda não decidida.',
    );
    const studentConflict = new QueryFailedError('insert', [], {
      code: '23505',
      constraint: 'uq_poker_rounds_student',
    });
    const studentConflictRepo = new PgPokerRoundRepository({
      transaction: jest.fn().mockRejectedValue(studentConflict),
    } as never);
    await expect(studentConflictRepo.open(newRound, [])).rejects.toThrow(
      'O aluno já foi avaliado.',
    );
    const otherError = new Error('unexpected');
    const otherRepo = new PgPokerRoundRepository({
      transaction: jest.fn().mockRejectedValue(otherError),
    } as never);
    await expect(otherRepo.open(newRound, [])).rejects.toBe(otherError);
  });

  it('cancels and restarts only when the row changed, and clears votes after restart', async () => {
    const manager = { query: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]) };
    const repository = new PgPokerRoundRepository({
      manager,
      transaction: jest.fn((work: (tx: typeof manager) => unknown) => work(manager)),
    } as never);
    const round = { id: 'round-1', pokerId: 'poker-1' } as never;
    await expect(repository.cancel(round, [])).resolves.toBe(false);
    await expect(repository.restart('round-1', [])).resolves.toBe(false);
    expect(manager.query).toHaveBeenCalledTimes(2);

    manager.query.mockResolvedValueOnce([{ id: 'round-1' }]).mockResolvedValueOnce([]);
    await expect(repository.cancel(round, ['student-1'])).resolves.toBe(true);
    manager.query.mockResolvedValueOnce([{ id: 'round-1' }]).mockResolvedValueOnce([]);
    await expect(
      repository.restart('round-1', [{ seat: 1, studentId: 'student-1' }]),
    ).resolves.toBe(true);
    expect(manager.query).toHaveBeenCalledTimes(6);
  });

  it('reveals, decides, casts votes, and lists votes using manager query results', async () => {
    const managerQuery = jest
      .fn()
      .mockResolvedValueOnce([[{ id: 'round-1' }], 1])
      .mockResolvedValueOnce([{ id: 'round-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ voterId: 'student-2', score: 9 }]);
    const repository = new PgPokerRoundRepository({
      manager: { query: managerQuery },
      query: managerQuery,
    } as never);

    await expect(repository.reveal('round-1', 9)).resolves.toBe(true);
    await expect(
      repository.decide('round-1', {
        finalGrade: 8,
        adjusted: false,
        justification: null,
        decidedBy: 'teacher-1',
        decidedAt: new Date(),
      }),
    ).resolves.toBe(true);
    await expect(repository.castVote('round-1', { voterId: 'student-2', score: 9 })).resolves.toBe(
      false,
    );
    await expect(repository.findVotes('round-1')).resolves.toEqual([
      { voterId: 'student-2', score: 9 },
    ]);
  });
});
