import type { PokerDecision, PokerRound, SeatAssignment } from '../entities/poker-round';

export const POKER_ROUND_REPOSITORY = Symbol('POKER_ROUND_REPOSITORY');

export interface NewPokerRound {
  pokerId: string;
  studentId: string;
  number: number;
  seats: SeatAssignment[];
}

export interface PokerVote {
  voterId: string;
  score: number;
}

export interface PokerRoundRepository {
  findOpen(pokerId: string): Promise<PokerRound | null>;
  findById(pokerId: string, roundId: string): Promise<PokerRound | null>;
  findDecided(pokerId: string): Promise<PokerRound[]>;
  findLast(pokerId: string): Promise<PokerRound | null>;
  open(round: NewPokerRound, queue: string[]): Promise<PokerRound>;
  cancel(round: PokerRound, queue: string[]): Promise<boolean>;
  reveal(roundId: string, average: number | null): Promise<boolean>;
  restart(roundId: string, seats: SeatAssignment[]): Promise<boolean>;
  decide(roundId: string, decision: PokerDecision): Promise<boolean>;
  castVote(roundId: string, vote: PokerVote): Promise<boolean>;
  findVotes(roundId: string): Promise<PokerVote[]>;
}
