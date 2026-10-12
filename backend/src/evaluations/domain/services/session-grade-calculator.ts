import { InvalidEvaluationItemsError } from '../errors/invalid-evaluation.error';
import type { SessionEvaluationCriterion } from '../entities/session-evaluation-criterion.entity';
import { EvaluationRules, type CriterionScore } from './evaluation-rules';

export const SESSION_CALCULATION_VERSION = 'WEIGHTED_SESSION_FORMULA_V3';

export class SessionGradeCalculator {
  static calculate(
    items: readonly CriterionScore[],
    criteria: readonly SessionEvaluationCriterion[],
    roleScore: number | null,
    applyCargoFormula = false,
    formula = { criteriaWeight: 70, roleWeight: 30 },
  ): number {
    EvaluationRules.assertValidItems(
      items,
      criteria.map((criterion) => criterion.id),
      true,
    );
    this.assertConfiguration(criteria, roleScore, formula);
    return this.weightedResult(items, criteria, roleScore, applyCargoFormula, formula);
  }

  private static weightedResult(
    items: readonly CriterionScore[],
    criteria: readonly SessionEvaluationCriterion[],
    roleScore: number | null,
    applyCargoFormula: boolean,
    formula: { criteriaWeight: number; roleWeight: number },
  ): number {
    const scores = new Map(
      items.map((item) => [item.criterionId, BigInt(Math.round(item.score * 100))]),
    );
    const weights = criteria.map((criterion) => BigInt(Math.round(criterion.weight * 100)));
    const total = this.totalWeight(weights);
    const weighted = criteria.reduce(
      (sum, criterion, index) => sum + scores.get(criterion.id)! * weights[index]!,
      0n,
    );
    return this.toGrade(weighted, total, roleScore, applyCargoFormula, formula);
  }

  private static toGrade(
    weighted: bigint,
    total: bigint,
    roleScore: number | null,
    applyCargoFormula: boolean,
    formula: { criteriaWeight: number; roleWeight: number },
  ): number {
    const roleScoreCents = BigInt(Math.round((roleScore ?? 0) * 100));
    const usesCargoFormula = applyCargoFormula && roleScore !== null;
    const criteriaWeight = BigInt(Math.round(formula.criteriaWeight * 100));
    const roleWeight = BigInt(Math.round(formula.roleWeight * 100));
    const sumFormulaWeights = criteriaWeight + roleWeight;
    const numerator = usesCargoFormula
      ? weighted * criteriaWeight + roleScoreCents * total * roleWeight
      : weighted;
    const denominator = usesCargoFormula ? total * sumFormulaWeights : total;
    const cents = (2n * numerator + denominator) / (2n * denominator);
    return Number(cents) / 100;
  }

  private static totalWeight(weights: bigint[]): bigint {
    const total = weights.reduce((sum, weight) => sum + weight, 0n);
    if (total === 0n)
      throw new InvalidEvaluationItemsError(
        'A soma dos pesos deve ser maior que zero para enviar a avaliação.',
      );
    return total;
  }

  private static assertConfiguration(
    criteria: readonly SessionEvaluationCriterion[],
    roleScore: number | null,
    formula: { criteriaWeight: number; roleWeight: number },
  ): void {
    assertRoleScore(roleScore);
    assertCriteriaWeights(criteria);
    assertFormulaWeights(formula);
  }
}

function assertRoleScore(roleScore: number | null): void {
  if (roleScore !== null && (!Number.isFinite(roleScore) || roleScore < 0 || roleScore > 10)) {
    throw new InvalidEvaluationItemsError('A nota do papel deve estar entre 0 e 10.');
  }
}

function assertCriteriaWeights(criteria: readonly SessionEvaluationCriterion[]): void {
  if (
    criteria.some(
      (criterion) =>
        !Number.isFinite(criterion.weight) || criterion.weight < 0 || criterion.weight > 10,
    )
  ) {
    throw new InvalidEvaluationItemsError('Os pesos dos critérios devem estar entre 0 e 10.');
  }
}

function assertFormulaWeights(formula: { criteriaWeight: number; roleWeight: number }): void {
  const totalFormulaWeight = formula.criteriaWeight + formula.roleWeight;
  const isSum100 = Math.abs(totalFormulaWeight - 100) <= 0.001;
  const isSum10 = Math.abs(totalFormulaWeight - 10) <= 0.001;
  if (
    !Number.isFinite(formula.criteriaWeight) ||
    !Number.isFinite(formula.roleWeight) ||
    formula.criteriaWeight < 0 ||
    formula.roleWeight < 0 ||
    (!isSum100 && !isSum10)
  ) {
    throw new InvalidEvaluationItemsError('A fórmula da sessão deve somar 100% ou 10.');
  }
}
