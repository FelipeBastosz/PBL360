import type { EntityManager } from 'typeorm';
import type {
  ComparisonAdjustment,
  ComparisonPlanningPoker,
} from '../../domain/entities/evaluation-history.entity';
import type { SelfEvaluationRow } from './evaluation-history.types';
import { readStudentPeerAdjustments, readStudentSelfAdjustments } from './evaluation-history.reads';
import { buildComparisonAdjustments } from './evaluation-history-comparison.builder';
import { buildComparisonPlanningPoker } from './evaluation-history-poker.builder';
import {
  readPokerRoundAdjustments,
  readPokerRoundVotes,
  readStudentDecidedPokerRound,
} from './evaluation-history-poker.reads';

export interface ComparisonPokerData {
  planningPoker: ComparisonPlanningPoker;
  ajustes: ComparisonAdjustment[];
}

export async function loadComparisonPoker(
  manager: EntityManager,
  sessionId: string,
  studentId: string,
): Promise<ComparisonPokerData | null> {
  const round = await readStudentDecidedPokerRound(manager, sessionId, studentId);
  if (!round) return null;
  const [votes, adjustments] = await Promise.all([
    readPokerRoundVotes(manager, round.id, round.anonymous),
    readPokerRoundAdjustments(manager, round.id),
  ]);
  return {
    planningPoker: buildComparisonPlanningPoker(round, votes),
    ajustes: buildComparisonAdjustments(adjustments),
  };
}

export interface ComparisonTarget {
  sessionId: string;
  studentId: string;
  selfEval: SelfEvaluationRow | null;
  poker: ComparisonPokerData | null;
}

const hasSubmittedSelf = (target: ComparisonTarget) => target.selfEval?.status === 'SUBMITTED';

export function comparisonPoker(target: ComparisonTarget): ComparisonPlanningPoker | null {
  return hasSubmittedSelf(target) ? null : (target.poker?.planningPoker ?? null);
}

export async function resolveComparisonAdjustments(
  manager: EntityManager,
  target: ComparisonTarget,
): Promise<ComparisonAdjustment[]> {
  if (hasSubmittedSelf(target)) {
    return buildComparisonAdjustments(
      await readStudentSelfAdjustments(manager, target.selfEval!.id),
    );
  }
  if (target.poker) return target.poker.ajustes;
  return buildComparisonAdjustments(
    await readStudentPeerAdjustments(manager, target.sessionId, target.studentId),
  );
}
