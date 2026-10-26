import type { PokerEvent } from '../../application/services/poker-event-publisher';
import { toPokerRevealResponse, toPokerRoundResponse } from '../http/poker-round.mapper';

export type PokerAudience = 'TUTOR' | 'STUDENT';

export interface PokerSocketMessage {
  name: string;
  payload: Record<string, unknown>;
}

function roundOpened(event: Extract<PokerEvent, { type: 'ROUND_OPENED' }>): PokerSocketMessage {
  const round = toPokerRoundResponse(event.round);
  return {
    name: 'poker.rodada_aberta',
    payload: {
      rodadaId: round.rodadaId,
      avaliado: round.avaliado,
      mesa: round.mesa,
      votantesEsperados: round.votantesEsperados,
    },
  };
}

function decided(
  event: Extract<PokerEvent, { type: 'DECIDED' }>,
  audience: PokerAudience,
): PokerSocketMessage {
  const payload =
    audience === 'TUTOR'
      ? { rodadaId: event.roundId, notaFinal: event.finalGrade, ajustada: event.adjusted }
      : { rodadaId: event.roundId };
  return { name: 'poker.decidida', payload };
}

function revealed(event: Extract<PokerEvent, { type: 'REVEALED' }>): PokerSocketMessage {
  return {
    name: 'poker.revelada',
    payload: { rodadaId: event.roundId, ...toPokerRevealResponse(event.reveal) },
  };
}

function voteCast(event: Extract<PokerEvent, { type: 'VOTE_CAST' }>): PokerSocketMessage {
  return {
    name: 'poker.voto_registrado',
    payload: {
      rodadaId: event.roundId,
      votaram: event.votedSeats.length,
      esperados: event.expected,
      lugaresQueVotaram: event.votedSeats,
    },
  };
}

export function toSocketMessage(event: PokerEvent, audience: PokerAudience): PokerSocketMessage {
  switch (event.type) {
    case 'ROUND_OPENED':
      return roundOpened(event);
    case 'VOTE_CAST':
      return voteCast(event);
    case 'REVEALED':
      return revealed(event);
    case 'DECIDED':
      return decided(event, audience);
    case 'ROUND_CANCELLED':
      return { name: 'poker.rodada_cancelada', payload: { rodadaId: event.roundId } };
    case 'QUEUE_UPDATED':
      return { name: 'poker.fila_atualizada', payload: { fila: event.queue } };
    case 'CLOSED':
      return { name: 'poker.encerrado', payload: { pokerId: event.pokerId } };
  }
}
