import { PokerOrder, PokerStatus, PlanningPoker } from '../../domain/entities/planning-poker';
import { PokerRound, PokerRoundStatus } from '../../domain/entities/poker-round';
import type { PlanningPokerRepository } from '../../domain/repositories/planning-poker.repository';
import type { PokerRoundRepository } from '../../domain/repositories/poker-round.repository';
import { PokerStateService } from './poker-state.service';

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

const roster = {
  participants: [{ studentId: 'student-1', name: 'Ana Souza', seatNumber: 1, hasPhoto: true }],
  absentees: [{ studentId: 'student-2', name: 'Bruno Lima', seatNumber: null, hasPhoto: false }],
};

const currentRound = new PokerRound({
  id: 'round-1',
  pokerId: poker.id,
  studentId: 'student-1',
  number: 1,
  status: PokerRoundStatus.VOTING,
  seats: [
    { seat: 1, studentId: 'student-1' },
    { seat: 2, studentId: 'student-2' },
  ],
  average: null,
  decision: null,
});

describe('PokerStateService', () => {
  const pokers = { findRoster: jest.fn() };
  const rounds = {
    findVotes: jest.fn(),
    findOpen: jest.fn(),
    findDecided: jest.fn(),
  };
  let service: PokerStateService;

  beforeEach(() => {
    jest.clearAllMocks();
    pokers.findRoster.mockResolvedValue(roster);
    rounds.findVotes.mockResolvedValue([{ voterId: 'student-2', score: 8 }]);
    rounds.findOpen.mockResolvedValue(currentRound);
    rounds.findDecided.mockResolvedValue([
      new PokerRound({
        id: 'round-0',
        pokerId: poker.id,
        studentId: 'removed-student',
        number: 0,
        status: PokerRoundStatus.DECIDED,
        seats: [],
        average: 7,
        decision: {
          finalGrade: 9,
          adjusted: true,
          justification: 'Ajuste',
          decidedBy: 'tutor-1',
          decidedAt: new Date('2026-01-01T00:00:00Z'),
        },
      }),
    ]);
    service = new PokerStateService(
      pokers as unknown as PlanningPokerRepository,
      rounds as unknown as PokerRoundRepository,
    );
  });

  it('indexes participants and absentees by student id', async () => {
    const students = await service.students('session-1');
    expect([...students.keys()]).toEqual(['student-1', 'student-2']);
    expect(students.get('student-1')).toMatchObject({ initials: 'AS', hasPhoto: true });
  });

  it('builds a round view from the current roster and votes', async () => {
    const view = await service.roundView(poker, currentRound);
    expect(view).toMatchObject({
      roundId: 'round-1',
      expectedVoters: 1,
      votedSeats: [2],
      reveal: null,
    });
    expect(rounds.findVotes).toHaveBeenCalledWith('round-1');
  });

  it('builds tutor state with a current round and completed rounds', async () => {
    const state = await service.forTutor(poker);
    expect(state.current?.roundId).toBe('round-1');
    expect(state.participants).toHaveLength(1);
    expect(state.absentees).toHaveLength(1);
    expect(state.completed).toMatchObject([
      { student: { id: 'removed-student', name: 'Aluno removido' }, finalGrade: 9, adjusted: true },
    ]);
  });

  it('builds tutor state without a current round', async () => {
    rounds.findOpen.mockResolvedValue(null);
    const state = await service.forTutor(poker);
    expect(state.current).toBeNull();
    expect(rounds.findVotes).not.toHaveBeenCalled();
  });

  it('builds student state only with a current round for a participant', async () => {
    const state = await service.forStudent(poker, 'student-1');
    expect(state.isParticipant).toBe(true);
    expect(state.current).toMatchObject({ isEvaluated: true, myVote: null, mySeat: 1 });
  });

  it('does not expose a current round to a nonparticipant', async () => {
    const state = await service.forStudent(poker, 'other-student');
    expect(state.isParticipant).toBe(false);
    expect(state.current).toBeNull();
  });

  it('does not expose a round when there is no open round', async () => {
    rounds.findOpen.mockResolvedValue(null);
    const state = await service.forStudent(poker, 'student-1');
    expect(state.isParticipant).toBe(true);
    expect(state.current).toBeNull();
  });
});
