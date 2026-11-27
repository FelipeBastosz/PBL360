import { PokerRoundStatus } from '../../domain/entities/poker-round';
import { toSocketMessage } from './poker-event.mapper';

describe('toSocketMessage', () => {
  const round = {
    roundId: 'round-1',
    number: 2,
    status: PokerRoundStatus.VOTING,
    evaluated: { id: 'student-1', name: 'Ana', initials: 'A', hasPhoto: false, seatNumber: 1 },
    table: [{ seat: 1, student: null, evaluated: true, voted: false }],
    expectedVoters: 2,
    votedSeats: [],
    reveal: null,
  };

  it('maps round, vote and reveal events to socket messages', () => {
    expect(toSocketMessage({ type: 'ROUND_OPENED', round } as never, 'TUTOR')).toMatchObject({
      name: 'poker.rodada_aberta',
      payload: { rodadaId: 'round-1', votantesEsperados: 2 },
    });
    expect(
      toSocketMessage(
        { type: 'VOTE_CAST', roundId: 'r1', votedSeats: [1, 3], expected: 4 } as never,
        'STUDENT',
      ),
    ).toEqual({
      name: 'poker.voto_registrado',
      payload: { rodadaId: 'r1', votaram: 2, esperados: 4, lugaresQueVotaram: [1, 3] },
    });
    expect(
      toSocketMessage(
        {
          type: 'REVEALED',
          roundId: 'r1',
          reveal: {
            votes: [{ seat: 1, score: 8, student: null }],
            average: 8,
            totalVotes: 1,
            missing: 1,
          },
        } as never,
        'STUDENT',
      ),
    ).toMatchObject({ name: 'poker.revelada', payload: { rodadaId: 'r1', totalVotos: 1 } });
  });

  it('limits decision details to tutors and maps the remaining lifecycle events', () => {
    const decision = { type: 'DECIDED', roundId: 'r1', finalGrade: 9, adjusted: true } as never;
    expect(toSocketMessage(decision, 'TUTOR')).toEqual({
      name: 'poker.decidida',
      payload: { rodadaId: 'r1', notaFinal: 9, ajustada: true },
    });
    expect(toSocketMessage(decision, 'STUDENT')).toEqual({
      name: 'poker.decidida',
      payload: { rodadaId: 'r1' },
    });
    expect(toSocketMessage({ type: 'ROUND_CANCELLED', roundId: 'r1' } as never, 'STUDENT')).toEqual(
      { name: 'poker.rodada_cancelada', payload: { rodadaId: 'r1' } },
    );
    expect(toSocketMessage({ type: 'QUEUE_UPDATED', queue: ['s1'] } as never, 'TUTOR')).toEqual({
      name: 'poker.fila_atualizada',
      payload: { fila: ['s1'] },
    });
    expect(toSocketMessage({ type: 'CLOSED', pokerId: 'p1' } as never, 'TUTOR')).toEqual({
      name: 'poker.encerrado',
      payload: { pokerId: 'p1' },
    });
  });
});
