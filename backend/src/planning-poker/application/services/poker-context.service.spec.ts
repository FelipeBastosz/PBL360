import { NotFoundError } from '@/shared/errors/application.error';
import type { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { PokerOrder, PokerStatus, PlanningPoker } from '../../domain/entities/planning-poker';
import { PokerRound, PokerRoundStatus } from '../../domain/entities/poker-round';
import type { PlanningPokerRepository } from '../../domain/repositories/planning-poker.repository';
import type { PokerRoundRepository } from '../../domain/repositories/poker-round.repository';
import { PokerContextService } from './poker-context.service';

const poker = new PlanningPoker({
  id: 'poker-1',
  sessionId: 'session-1',
  anonymous: false,
  order: PokerOrder.SEQUENTIAL,
  status: PokerStatus.OPEN,
  queue: ['student-1'],
  createdBy: 'tutor-1',
  createdAt: new Date('2026-01-01T00:00:00Z'),
});

const round = new PokerRound({
  id: 'round-1',
  pokerId: poker.id,
  studentId: 'student-1',
  number: 1,
  status: PokerRoundStatus.VOTING,
  seats: [],
  average: null,
  decision: null,
});

describe('PokerContextService', () => {
  const access = {
    assertTutorCanAccessSessionById: jest.fn().mockResolvedValue(undefined),
    assertMemberCanAccessSession: jest.fn().mockResolvedValue(undefined),
  };
  const pokers = { findOpenBySession: jest.fn() };
  const rounds = { findById: jest.fn() };
  let service: PokerContextService;

  beforeEach(() => {
    jest.clearAllMocks();
    pokers.findOpenBySession.mockResolvedValue(poker);
    rounds.findById.mockResolvedValue(round);
    service = new PokerContextService(
      access as unknown as SessionAccessService,
      pokers as unknown as PlanningPokerRepository,
      rounds as unknown as PokerRoundRepository,
    );
  });

  it('authorizes a tutor before finding the open poker', async () => {
    await expect(service.forTutor('session-1', 'tutor-1')).resolves.toBe(poker);
    expect(access.assertTutorCanAccessSessionById).toHaveBeenCalledWith('session-1', 'tutor-1');
    expect(pokers.findOpenBySession).toHaveBeenCalledWith('session-1');
  });

  it('authorizes a room member before finding the open poker', async () => {
    const member = { id: 'student-1', type: 'STUDENT' } as const;
    await expect(service.forMember('session-1', member)).resolves.toBe(poker);
    expect(access.assertMemberCanAccessSession).toHaveBeenCalledWith('session-1', member);
  });

  it('rejects requests when no open poker exists', async () => {
    pokers.findOpenBySession.mockResolvedValue(null);
    await expect(service.forTutor('session-1', 'tutor-1')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('loads a tutor round context and rejects a missing round', async () => {
    await expect(
      service.roundForTutor({ sessionId: 'session-1', tutorId: 'tutor-1', roundId: 'round-1' }),
    ).resolves.toEqual({ poker, round });
    expect(rounds.findById).toHaveBeenCalledWith(poker.id, 'round-1');

    rounds.findById.mockResolvedValue(null);
    await expect(
      service.roundForTutor({ sessionId: 'session-1', tutorId: 'tutor-1', roundId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
