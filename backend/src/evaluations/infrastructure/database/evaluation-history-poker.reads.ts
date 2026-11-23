import type { EntityManager } from 'typeorm';
import {
  FIND_POKER_ADJUSTMENTS_DETAIL_QUERY,
  FIND_POKER_ROUND_VOTES_QUERY,
  FIND_SESSION_DECIDED_POKER_ROUNDS_QUERY,
  FIND_STUDENT_DECIDED_POKER_ROUND_QUERY,
} from './evaluation-history-poker.queries';
import type {
  PokerRoundHistoryRow,
  PokerVoteRow,
  SelfAdjustmentDetailRow,
} from './evaluation-history.types';

export function readSessionDecidedPokerRounds(
  manager: EntityManager,
  sessionId: string,
): Promise<PokerRoundHistoryRow[]> {
  return manager.query<PokerRoundHistoryRow[]>(FIND_SESSION_DECIDED_POKER_ROUNDS_QUERY, [
    sessionId,
  ]);
}

export async function readStudentDecidedPokerRound(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
): Promise<PokerRoundHistoryRow | null> {
  const [row] = await manager.query<PokerRoundHistoryRow[]>(
    FIND_STUDENT_DECIDED_POKER_ROUND_QUERY,
    [sessionId, studentId],
  );
  return row ?? null;
}

export function readPokerRoundVotes(
  manager: EntityManager,
  roundId: string,
): Promise<PokerVoteRow[]> {
  return manager.query<PokerVoteRow[]>(FIND_POKER_ROUND_VOTES_QUERY, [roundId]);
}

export function readPokerRoundAdjustments(
  manager: EntityManager,
  roundId: string,
): Promise<SelfAdjustmentDetailRow[]> {
  return manager.query<SelfAdjustmentDetailRow[]>(FIND_POKER_ADJUSTMENTS_DETAIL_QUERY, [roundId]);
}
