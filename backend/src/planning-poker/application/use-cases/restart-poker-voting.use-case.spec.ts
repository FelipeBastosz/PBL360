import { PokerRoundStatus } from '../../domain/entities/poker-round';
import { ConflictError } from '@/shared/errors/application.error';
import { RestartPokerVotingUseCase } from './restart-poker-voting.use-case';

describe('RestartPokerVotingUseCase', () => {
  const input = { sessionId: 's1', tutorId: 't1', roundId: 'r1' };
  const poker = { id: 'p1', sessionId: 's1', anonymous: false };
  const round = {
    id: 'r1',
    pokerId: 'p1',
    studentId: 's2',
    number: 2,
    status: PokerRoundStatus.REVEALED,
    seats: [
      { seat: 1, studentId: 's1' },
      { seat: 2, studentId: 's2' },
    ],
    average: 8,
    decision: null,
  };

  it('draws a fresh voting order, returns the view and publishes the reopened round', async () => {
    const context = { roundForTutor: jest.fn().mockResolvedValue({ poker, round }) };
    const view = { roundId: 'r1', status: PokerRoundStatus.VOTING };
    const state = { roundView: jest.fn().mockResolvedValue(view) };
    const rounds = { restart: jest.fn().mockResolvedValue(true) };
    const events = { publish: jest.fn() };
    const useCase = new RestartPokerVotingUseCase(
      context as never,
      state as never,
      rounds as never,
      events,
    );
    await expect(useCase.execute(input)).resolves.toBe(view);
    expect(rounds.restart).toHaveBeenCalledWith('r1', [
      { seat: 1, studentId: 's1' },
      { seat: 2, studentId: 's2' },
    ]);
    expect(state.roundView).toHaveBeenCalledWith(
      poker,
      expect.objectContaining({
        status: PokerRoundStatus.VOTING,
        average: null,
      }),
    );
    expect(events.publish).toHaveBeenCalledWith('s1', { type: 'ROUND_OPENED', round: view });
  });

  it('rejects restarting when the round is already decided or not revealed', async () => {
    const context = { roundForTutor: jest.fn().mockResolvedValue({ poker, round }) };
    const state = { roundView: jest.fn() };
    const rounds = { restart: jest.fn().mockResolvedValue(false) };
    const events = { publish: jest.fn() };
    const useCase = new RestartPokerVotingUseCase(
      context as never,
      state as never,
      rounds as never,
      events,
    );
    await expect(useCase.execute(input)).rejects.toThrow(
      new ConflictError('Só é possível votar novamente depois de revelar e antes de decidir.'),
    );
    expect(events.publish).not.toHaveBeenCalled();
  });
});
