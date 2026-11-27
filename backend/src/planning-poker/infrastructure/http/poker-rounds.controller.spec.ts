import { PokerDecisionPayload } from '../../application/dtos/planning-poker-request.dto';
import { PokerRoundStatus } from '../../domain/entities/poker-round';
import { PokerRoundsController } from './poker-rounds.controller';

describe('PokerRoundsController', () => {
  const round = {
    roundId: 'r1',
    number: 2,
    status: PokerRoundStatus.VOTING,
    evaluated: { id: 'a1', name: 'Ana', initials: 'A', hasPhoto: false, seatNumber: 1 },
    table: [],
    expectedVoters: 2,
    votedSeats: [],
    reveal: null,
  };

  it('opens a round for the selected student or for the next student', async () => {
    const open = { execute: jest.fn().mockResolvedValue(round) };
    const controller = new PokerRoundsController(
      open as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(controller.open('s1', { alunoId: 'a1' }, 't1')).resolves.toMatchObject({
      rodadaId: 'r1',
      status: 'VOTANDO',
    });
    await expect(controller.open('s1', {}, 't1')).resolves.toMatchObject({ rodadaId: 'r1' });
    expect(open.execute).toHaveBeenNthCalledWith(1, {
      sessionId: 's1',
      tutorId: 't1',
      studentId: 'a1',
    });
    expect(open.execute).toHaveBeenNthCalledWith(2, {
      sessionId: 's1',
      tutorId: 't1',
      studentId: null,
    });
  });

  it('cancels a round and records a student vote', async () => {
    const cancel = { execute: jest.fn() };
    const vote = { execute: jest.fn().mockResolvedValue(8.5) };
    const controller = new PokerRoundsController(
      {} as never,
      cancel as never,
      vote as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(controller.cancel('s1', 'r1', 't1')).resolves.toBeUndefined();
    expect(cancel.execute).toHaveBeenCalledWith({ sessionId: 's1', tutorId: 't1', roundId: 'r1' });
    await expect(controller.vote('s1', 'r1', { nota: 8.5 }, 'a2')).resolves.toEqual({
      votou: true,
      nota: 8.5,
    });
    expect(vote.execute).toHaveBeenCalledWith({
      sessionId: 's1',
      roundId: 'r1',
      studentId: 'a2',
      score: 8.5,
    });
  });

  it('reveals, restarts and decides a round', async () => {
    const reveal = {
      execute: jest.fn().mockResolvedValue({ votes: [], average: 7, totalVotes: 2, missing: [] }),
    };
    const restart = { execute: jest.fn().mockResolvedValue(round) };
    const decide = {
      execute: jest.fn().mockResolvedValue({
        studentId: 'a1',
        average: 7,
        decision: {
          finalGrade: 7,
          adjusted: false,
          decidedBy: 't1',
          decidedAt: new Date('2026-01-02T03:04:05Z'),
        },
      }),
    };
    const controller = new PokerRoundsController(
      {} as never,
      {} as never,
      {} as never,
      reveal as never,
      restart as never,
      decide as never,
    );

    await expect(controller.reveal('s1', 'r1', 't1')).resolves.toEqual({
      votos: [],
      media: 7,
      totalVotos: 2,
      faltaram: [],
    });
    await expect(controller.revote('s1', 'r1', 't1')).resolves.toMatchObject({ rodadaId: 'r1' });
    await expect(
      controller.decide('s1', 'r1', { acao: PokerDecisionPayload.ACEITAR }, 't1'),
    ).resolves.toEqual({
      alunoId: 'a1',
      media: 7,
      notaFinal: 7,
      ajustada: false,
      decididoPor: 't1',
      decididoEm: new Date('2026-01-02T03:04:05Z'),
    });
    expect(reveal.execute).toHaveBeenCalledWith({ sessionId: 's1', tutorId: 't1', roundId: 'r1' });
    expect(restart.execute).toHaveBeenCalledWith({ sessionId: 's1', tutorId: 't1', roundId: 'r1' });
    expect(decide.execute).toHaveBeenCalledWith({
      sessionId: 's1',
      tutorId: 't1',
      roundId: 'r1',
      action: { type: 'ACCEPT' },
    });
  });
});
