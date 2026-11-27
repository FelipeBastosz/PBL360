import { PokerOrder, PokerStatus } from '../../domain/entities/planning-poker';
import { QueryFailedError } from 'typeorm';
import { PgPlanningPokerRepository } from './pg-planning-poker.repository';

describe('PgPlanningPokerRepository', () => {
  const row = {
    id: 'poker-1',
    sessionId: 'session-1',
    anonymous: false,
    order: PokerOrder.SEQUENTIAL,
    status: PokerStatus.OPEN,
    queue: ['student-1'],
    createdBy: 'teacher-1',
    createdAt: new Date(),
  };

  it('finds open poker and returns null when no row exists', async () => {
    const query = jest.fn().mockResolvedValueOnce([row]).mockResolvedValueOnce([]);
    const repository = new PgPlanningPokerRepository({ query } as never);

    await expect(repository.findOpenBySession('session-1')).resolves.toMatchObject(row);
    await expect(repository.findOpenBySession('session-2')).resolves.toBeNull();
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('splits roster into present participants and absentees and maps seat numbers', async () => {
    const query = jest.fn().mockResolvedValue([
      { studentId: 'student-1', name: 'Ana', seatNumber: '2', hasPhoto: true, isParticipant: true },
      {
        studentId: 'student-2',
        name: 'Bia',
        seatNumber: null,
        hasPhoto: false,
        isParticipant: false,
      },
    ]);
    const repository = new PgPlanningPokerRepository({ query } as never);

    await expect(repository.findRoster('session-1')).resolves.toEqual({
      participants: [{ studentId: 'student-1', name: 'Ana', seatNumber: 2, hasPhoto: true }],
      absentees: [{ studentId: 'student-2', name: 'Bia', seatNumber: null, hasPhoto: false }],
    });
  });

  it('creates poker, reports unique open-poker conflicts, and propagates other errors', async () => {
    const query = jest.fn().mockResolvedValue([row]);
    const repository = new PgPlanningPokerRepository({ query } as never);
    const poker = {
      sessionId: 'session-1',
      anonymous: false,
      order: PokerOrder.SEQUENTIAL,
      queue: ['student-1'],
      createdBy: 'teacher-1',
    };
    await expect(repository.create(poker)).resolves.toMatchObject(row);
    expect(query).toHaveBeenNthCalledWith(1, expect.any(String), [
      'session-1',
      false,
      PokerOrder.SEQUENTIAL,
      ['student-1'],
      'teacher-1',
    ]);

    const conflict = new QueryFailedError('insert', [], {
      code: '23505',
      constraint: 'uq_poker_sessions_open',
    });
    const failedRepo = new PgPlanningPokerRepository({
      query: jest.fn().mockRejectedValue(conflict),
    } as never);
    await expect(failedRepo.create(poker)).rejects.toThrow(
      'Já existe um planning poker aberto nesta sessão.',
    );
    const otherError = new Error('database unavailable');
    const otherRepo = new PgPlanningPokerRepository({
      query: jest.fn().mockRejectedValue(otherError),
    } as never);
    await expect(otherRepo.create(poker)).rejects.toBe(otherError);
  });

  it('requires a returned row when creating and updates the queue', async () => {
    const query = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const repository = new PgPlanningPokerRepository({ query } as never);
    const poker = {
      sessionId: 'session-1',
      anonymous: false,
      order: PokerOrder.MANUAL,
      queue: [],
      createdBy: 'teacher-1',
    };
    await expect(repository.create(poker)).rejects.toThrow('Planning poker was not created.');
    await repository.updateQueue('poker-1', ['student-2']);
    expect(query).toHaveBeenNthCalledWith(2, expect.any(String), ['poker-1', ['student-2']]);
  });

  it('closes open sessions according to both supported query result shapes', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'poker-1' }])
      .mockResolvedValueOnce([[], 0]);
    const repository = new PgPlanningPokerRepository({ query } as never);
    await expect(repository.close('poker-1', 'teacher-1')).resolves.toBe(true);
    await expect(repository.close('poker-1', 'teacher-1')).resolves.toBe(false);
  });
});
