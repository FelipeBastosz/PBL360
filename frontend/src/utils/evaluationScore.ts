import type { EvaluationCriterion, EvaluationFormula } from '@/types/evaluation';

export function getRolePercentage(formula?: EvaluationFormula): number {
  const criteriaWeight = formula?.criteriaWeight ?? 70;
  const roleWeight = formula?.roleWeight ?? 30;
  const total = criteriaWeight + roleWeight;
  if (total <= 0) return 30;
  return Math.round((roleWeight / total) * 100);
}

export type CalculateSessionScoreParams = {
  criteria: EvaluationCriterion[];
  scores: Record<string, number>;
  roleScore?: number | null;
  formula?: EvaluationFormula;
  hasRole?: boolean;
};

export function calculateSessionScore({
  criteria,
  scores,
  roleScore,
  formula,
  hasRole,
}: CalculateSessionScoreParams): number {
  const totalWeight = criteria.reduce((sum, c) => sum + c.peso, 0);
  if (totalWeight <= 0) return 0;

  const weightedSum = criteria.reduce((sum, c) => {
    const score = scores[c.id] ?? 0;
    return sum + score * c.peso;
  }, 0);
  const criteriaAverage = weightedSum / totalWeight;

  const effectiveHasRole = hasRole ?? (roleScore !== undefined && roleScore !== null);
  if (!effectiveHasRole) {
    return Math.round((criteriaAverage + Number.EPSILON) * 10) / 10;
  }

  const effectiveRoleScore = roleScore ?? 0;
  const criteriaWeight = formula?.criteriaWeight ?? 70;
  const roleWeight = formula?.roleWeight ?? 30;
  const totalFormulaWeight = criteriaWeight + roleWeight;

  if (totalFormulaWeight <= 0) {
    return Math.round((criteriaAverage + Number.EPSILON) * 10) / 10;
  }

  const finalScore =
    (criteriaAverage * criteriaWeight + effectiveRoleScore * roleWeight) / totalFormulaWeight;
  return Math.round((finalScore + Number.EPSILON) * 10) / 10;
}
