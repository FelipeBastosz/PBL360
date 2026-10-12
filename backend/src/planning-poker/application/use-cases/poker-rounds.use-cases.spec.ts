import {
  ConflictError,
  ForbiddenError,
  InvalidRequestError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import { PokerOrder } from '../../domain/entities/planning-poker';
import { PokerRoundStatus } from '../../domain/entities/poker-round';
import {
  aPoker,
  aRound,
  pokerRepositoryDouble,
  publisherDouble,
  roundRepositoryDouble,
} from '../../testing/poker-fixtures';
import type { PokerContextService } from '../services/poker-context.service';
import type { PokerStateService } from '../services/poker-state.service';
import type { RoundView } from '../services/poker-views';
import { CastPokerVoteUseCase } from './cast-poker-vote.use-case';
import { DecidePokerRoundUseCase } from './decide-poker-round.use-case';
import { OpenPokerRoundUseCase } from './open-poker-round.use-case';
import { ReorderPokerQueueUseCase } from './reorder-poker-queue.use-case';
import { RevealPokerRoundUseCase } from './reveal-poker-round.use-case';

const ROUND_REF = { sessionId: 'session-1', tutorId: 'tutor-1', roundId: 'round-1' };

describe('planning poker rounds', () => {
  let pokers: ReturnType<typeof pokerRepositoryDouble>;
  let rounds: ReturnType<typeof roundRepositoryDouble>;
  let events: ReturnType<typeof publisherDouble>;
  let context: jest.Mocked<Pick<PokerContextService, 'forTutor' | 'forMember' | 'roundForTutor'>>;
  let state: jest.Mocked<Pick<PokerStateService, 'roundView'>>;

  beforeEach(() => {
    pokers = pokerRepositoryDouble();
    rounds = roundRepositoryDouble();
    events = publisherDouble();
    context = {
      forTutor: jest.fn().mockResolvedValue(aPoker()),
      forMember: jest.fn().mockResolvedValue(aPoker()),
      roundForTutor: jest.fn().mockResolvedValue({ poker: aPoker(), round: aRound() }),
    };
    state = {
      roundView: jest
        .fn()
        .mockImplementation((_poker, round: { status: string }) =>
          Promise.resolve({ roundId: 'round-1', status: round.status, reveal: {} } as RoundView),
        ),
    };
  });

  const asContext = () => context as unknown as PokerContextService;
  const asState = () => state as unknown as PokerStateService;

  describe('OpenPokerRoundUseCase', () => {
    const useCase = () => new OpenPokerRoundUseCase(asContext(), asState(), pokers, rounds, events);

    it('opens the next student of the queue in sequential mode', async () => {
      rounds.open.mockResolvedValue(aRound({ studentId: 'bruno' }));

      await useCase().execute({ sessionId: 'session-1', tutorId: 'tutor-1', studentId: null });

      expect(rounds.open).toHaveBeenCalledWith(
        expect.objectContaining({ studentId: 'bruno', number: 1 }),
        ['carla'],
      );
      expect(events.publish).toHaveBeenCalledWith(
        'session-1',
        expect.objectContaining({ type: 'ROUND_OPENED' }),
      );
    });

    it('requires the tutor to choose the student in manual mode', async () => {
      context.forTutor.mockResolvedValue(aPoker({ order: PokerOrder.MANUAL }));

      await expect(
        useCase().execute({ sessionId: 'session-1', tutorId: 'tutor-1', studentId: null }),
      ).rejects.toThrow(InvalidRequestError);
    });

    it('refuses a student who already left the queue', async () => {
      await expect(
        useCase().execute({ sessionId: 'session-1', tutorId: 'tutor-1', studentId: 'ana' }),
      ).rejects.toThrow(UnprocessableEntityError);
    });

    it('refuses a second round while one is undecided', async () => {
      rounds.findOpen.mockResolvedValue(aRound());

      await expect(
        useCase().execute({ sessionId: 'session-1', tutorId: 'tutor-1', studentId: null }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('CastPokerVoteUseCase', () => {
    const useCase = () => new CastPokerVoteUseCase(asContext(), rounds, events);
    const vote = (studentId: string) =>
      useCase().execute({ sessionId: 'session-1', roundId: 'round-1', studentId, score: 8.5 });

    beforeEach(() => rounds.findById.mockResolvedValue(aRound()));

    it('records the vote and announces only the seats that voted', async () => {
      rounds.findVotes.mockResolvedValue([{ voterId: 'bruno', score: 8.5 }]);

      await expect(vote('bruno')).resolves.toBe(8.5);

      expect(events.publish).toHaveBeenCalledWith('session-1', {
        type: 'VOTE_CAST',
        roundId: 'round-1',
        votedSeats: [2],
        expected: 2,
      });
    });

    it('forbids the evaluated student from voting', async () => {
      await expect(vote('ana')).rejects.toThrow(ForbiddenError);
    });

    it('forbids a student who is not at the table', async () => {
      await expect(vote('zeca')).rejects.toThrow(ForbiddenError);
    });

    it('rejects a vote after the reveal', async () => {
      rounds.castVote.mockResolvedValue(false);

      await expect(vote('bruno')).rejects.toThrow(ConflictError);
      expect(events.publish).not.toHaveBeenCalled();
    });
  });

  describe('RevealPokerRoundUseCase', () => {
    it('reveals with the average of the received votes only', async () => {
      rounds.findVotes.mockResolvedValue([
        { voterId: 'bruno', score: 8 },
        { voterId: 'carla', score: 9.5 },
      ]);
      const useCase = new RevealPokerRoundUseCase(asContext(), asState(), rounds, events);

      await useCase.execute(ROUND_REF);

      expect(rounds.reveal).toHaveBeenCalledWith('round-1', 8.75);
      expect(events.publish).toHaveBeenCalledWith(
        'session-1',
        expect.objectContaining({ type: 'REVEALED' }),
      );
    });
  });

  describe('DecidePokerRoundUseCase', () => {
    const useCase = () => new DecidePokerRoundUseCase(asContext(), rounds, events);
    const revealed = (average: number | null) => ({
      poker: aPoker(),
      round: aRound({ status: PokerRoundStatus.REVEALED, average }),
    });

    it('accepts the average as the final grade', async () => {
      context.roundForTutor.mockResolvedValue(revealed(8.25));

      const result = await useCase().execute({ ...ROUND_REF, action: { type: 'ACCEPT' } });

      expect(result.decision).toMatchObject({ finalGrade: 8.25, adjusted: false });
    });

    it('records an adjusted grade with its justification', async () => {
      context.roundForTutor.mockResolvedValue(revealed(7));
      const action = { type: 'ADJUST' as const, grade: 8.5, justification: 'Conduziu a síntese.' };

      const result = await useCase().execute({ ...ROUND_REF, action });

      expect(result.decision).toMatchObject({ finalGrade: 8.5, adjusted: true });
      expect(events.publish).toHaveBeenCalledWith('session-1', {
        type: 'DECIDED',
        roundId: 'round-1',
        finalGrade: 8.5,
        adjusted: true,
      });
    });

    it('refuses to accept a round without votes', async () => {
      context.roundForTutor.mockResolvedValue(revealed(null));

      await expect(useCase().execute({ ...ROUND_REF, action: { type: 'ACCEPT' } })).rejects.toThrow(
        UnprocessableEntityError,
      );
    });

    it('refuses to decide a round that was not revealed', async () => {
      await expect(useCase().execute({ ...ROUND_REF, action: { type: 'ACCEPT' } })).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe('ReorderPokerQueueUseCase', () => {
    const useCase = () => new ReorderPokerQueueUseCase(asContext(), pokers, events);
    const reorder = (queue: string[]) =>
      useCase().execute({ sessionId: 'session-1', tutorId: 'tutor-1', queue });

    it('saves the new order of the pending students', async () => {
      await expect(reorder(['carla', 'bruno'])).resolves.toEqual(['carla', 'bruno']);

      expect(pokers.updateQueue).toHaveBeenCalledWith('poker-1', ['carla', 'bruno']);
    });

    it('rejects a queue with different students', async () => {
      await expect(reorder(['carla'])).rejects.toThrow(UnprocessableEntityError);
    });

    it('only allows editing the queue in sequential mode', async () => {
      context.forTutor.mockResolvedValue(aPoker({ order: PokerOrder.MANUAL }));

      await expect(reorder(['carla', 'bruno'])).rejects.toThrow(ConflictError);
    });
  });
});
