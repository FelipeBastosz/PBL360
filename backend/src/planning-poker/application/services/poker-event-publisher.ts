import type { RoundReveal, RoundView } from './poker-views';

export const POKER_EVENT_PUBLISHER = Symbol('POKER_EVENT_PUBLISHER');

export type PokerEvent =
  | { type: 'ROUND_OPENED'; round: RoundView }
  | { type: 'VOTE_CAST'; roundId: string; votedSeats: number[]; expected: number }
  | { type: 'REVEALED'; roundId: string; reveal: RoundReveal }
  | { type: 'DECIDED'; roundId: string; finalGrade: number; adjusted: boolean }
  | { type: 'ROUND_CANCELLED'; roundId: string }
  | { type: 'QUEUE_UPDATED'; queue: string[] }
  | { type: 'CLOSED'; pokerId: string };

export interface PokerEventPublisher {
  publish(sessionId: string, event: PokerEvent): void;
}
