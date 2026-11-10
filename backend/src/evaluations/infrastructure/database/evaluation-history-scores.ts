import type { SessionEvaluationCriterion } from '../../domain/entities/session-evaluation-criterion.entity';
import { SessionGradeCalculator } from '../../domain/services/session-grade-calculator';

export type HistoryCriterionInput = {
  id: string;
  weight: number;
  name?: string;
  description?: string | null;
  orderIndex?: number;
};

function toSessionCriteria(
  criteria: readonly HistoryCriterionInput[],
): SessionEvaluationCriterion[] {
  return criteria.map((c, index) => ({
    id: c.id,
    weight: c.weight,
    name: c.name ?? '',
    description: c.description ?? null,
    orderIndex: c.orderIndex ?? index,
  }));
}

export function calculateCriteriaScore(
  items: Array<{ criterionId: string; score: number }>,
  criteria: HistoryCriterionInput[],
): number | null {
  if (items.length === 0) return null;
  const scoreMap = new Map(items.map((i) => [i.criterionId, i.score]));
  let weightedSum = 0;
  let totalWeight = 0;
  for (const c of criteria) {
    const sc = scoreMap.get(c.id);
    if (sc !== undefined) {
      weightedSum += sc * c.weight;
      totalWeight += c.weight;
    }
  }
  return totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(2)) : null;
}

function calculateCriteriaScoreWithBonus(
  items: Array<{ criterionId: string; score: number }>,
  config: {
    criteria: HistoryCriterionInput[];
    formula: { criteriaWeight: number; roleWeight: number };
  },
  bonus: number,
): number | null {
  const criteriaScore = calculateCriteriaScore(items, config.criteria);
  if (criteriaScore === null) return null;
  const { criteriaWeight, roleWeight } = config.formula;
  const total = criteriaWeight + roleWeight;
  if (total === 0) return criteriaScore;
  return Number(((criteriaScore * criteriaWeight + bonus * roleWeight) / total).toFixed(2));
}

export function calculateTutorScore(
  items: Array<{ criterionId: string; score: number }>,
  config: {
    criteria: HistoryCriterionInput[];
    formula: { criteriaWeight: number; roleWeight: number };
  },
  bonus: number | null,
): number | null {
  if (items.length === 0) return null;
  if (bonus === null) return calculateCriteriaScore(items, config.criteria);
  return calculateTutorFormulaScore(items, config, bonus);
}

function calculateTutorFormulaScore(
  items: Array<{ criterionId: string; score: number }>,
  config: {
    criteria: HistoryCriterionInput[];
    formula: { criteriaWeight: number; roleWeight: number };
  },
  bonus: number,
): number | null {
  try {
    return SessionGradeCalculator.calculate(
      items,
      toSessionCriteria(config.criteria),
      bonus,
      true,
      config.formula,
    );
  } catch {
    return calculateCriteriaScoreWithBonus(items, config, bonus);
  }
}

export function calculatePeerAverage(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
  return Number(avg.toFixed(2));
}
