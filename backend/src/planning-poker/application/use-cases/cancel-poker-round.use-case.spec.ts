import { ConflictError } from '@/shared/errors/application.error';
import { CancelPokerRoundUseCase } from './cancel-poker-round.use-case';

describe('CancelPokerRoundUseCase', () => {
  const input = { sessionId: 's1', tutorId: 't1', roundId: 'r1' };
  const poker = { sessionId: 's1', withFirst: jest.fn().mockReturnValue({ queue: ['u1'] }) };
  const round = { id: 'r1', studentId: 'u1' };

  it('cancels an open round and publishes the lifecycle event', async () => {
    const context = { roundForTutor: jest.fn().mockResolvedValue({ poker, round }) };
    const rounds = { cancel: jest.fn().mockResolvedValue(true) };
    const events = { publish: jest.fn() };
    const useCase = new CancelPokerRoundUseCase(context as never, rounds as never, events);
    await expect(useCase.execute(input)).resolves.toBeUndefined();
    expect(context.roundForTutor).toHaveBeenCalledWith(input);
    expect(poker.withFirst).toHaveBeenCalledWith('u1');
    expect(rounds.cancel).toHaveBeenCalledWith(round, { queue: ['u1'] });
    expect(events.publish).toHaveBeenCalledWith('s1', { type: 'ROUND_CANCELLED', roundId: 'r1' });
  });

  it('rejects cancellation after a round has been decided', async () => {
    const context = { roundForTutor: jest.fn().mockResolvedValue({ poker, round }) };
    const rounds = { cancel: jest.fn().mockResolvedValue(false) };
    const events = { publish: jest.fn() };
    const useCase = new CancelPokerRoundUseCase(context as never, rounds as never, events);
    await expect(useCase.execute(input)).rejects.toThrow(
      new ConflictError('A rodada já foi decidida.'),
    );
    expect(events.publish).not.toHaveBeenCalled();
  });
});
