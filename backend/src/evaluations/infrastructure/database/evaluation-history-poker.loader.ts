import type { EntityManager } from 'typeorm';
import type {
  ComparisonAdjustment,
  ComparisonPlanningPoker,
  StudentSessionEvaluationComparison,
} from '../../domain/entities/evaluation-history.entity';
import type { SelfEvaluationRow } from './evaluation-history.types';
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
    readPokerRoundVotes(manager, round.id),
    readPokerRoundAdjustments(manager, round.id),
  ]);
  return {
    planningPoker: buildComparisonPlanningPoker(round, votes),
    ajustes: buildComparisonAdjustments(adjustments),
  };
}

export function withPokerComparison(
  comparison: StudentSessionEvaluationComparison,
  selfEval: SelfEvaluationRow | null,
  poker: ComparisonPokerData | null,
): StudentSessionEvaluationComparison {
  if (!poker || selfEval?.status === 'SUBMITTED') return comparison;
  return { ...comparison, planningPoker: poker.planningPoker, ajustes: poker.ajustes };
}
