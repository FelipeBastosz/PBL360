import { InvalidEvaluationItemsError } from '../errors/invalid-evaluation.error';
import type { SessionEvaluationCriterion } from '../entities/session-evaluation-criterion.entity';
import { EvaluationRules, type CriterionScore } from './evaluation-rules';

export const SESSION_CALCULATION_VERSION = 'WEIGHTED_SESSION_FORMULA_V3';

export class SessionGradeCalculator {
  static calculate(
    items: readonly CriterionScore[],
    criteria: readonly SessionEvaluationCriterion[],
    bonus: number | null,
    applyCargoFormula = false,
    formula = { criteriaWeight: 70, roleWeight: 30 },
  ): number {
    EvaluationRules.assertValidItems(
      items,
      criteria.map((criterion) => criterion.id),
      true,
    );
    this.assertConfiguration(criteria, bonus, formula);
    return this.weightedResult(items, criteria, bonus, applyCargoFormula, formula);
  }

  private static weightedResult(
    items: readonly CriterionScore[],
    criteria: readonly SessionEvaluationCriterion[],
    bonus: number | null,
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
    return this.toGrade(weighted, total, bonus, applyCargoFormula, formula);
  }

  private static toGrade(
    weighted: bigint,
    total: bigint,
    bonus: number | null,
    applyCargoFormula: boolean,
    formula: { criteriaWeight: number; roleWeight: number },
  ): number {
    const cargoScoreCents = BigInt(Math.round((bonus ?? 0) * 1000));
    const usesCargoFormula = applyCargoFormula && bonus !== null;
    const criteriaWeight = BigInt(Math.round(formula.criteriaWeight * 100));
    const roleWeight = BigInt(Math.round(formula.roleWeight * 100));
    const numerator = usesCargoFormula
      ? weighted * criteriaWeight + cargoScoreCents * total * roleWeight
      : weighted;
    const denominator = usesCargoFormula ? total * 10000n : total;
    const cents = (2n * numerator + denominator) / (2n * denominator);
    return Number(cents > 1000n ? 1000n : cents) / 100;
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
    bonus: number | null,
    formula: { criteriaWeight: number; roleWeight: number },
  ): void {
    assertBonus(bonus);
    assertCriteriaWeights(criteria);
    assertFormulaWeights(formula);
  }
}

function assertBonus(bonus: number | null): void {
  if (bonus !== null && (!Number.isFinite(bonus) || bonus < 0 || bonus > 1)) {
    throw new InvalidEvaluationItemsError('O adicional de papel deve estar entre 0 e 1.');
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
  if (
    !Number.isFinite(formula.criteriaWeight) ||
    !Number.isFinite(formula.roleWeight) ||
    formula.criteriaWeight < 0 ||
    formula.criteriaWeight > 100 ||
    formula.roleWeight < 0 ||
    formula.roleWeight > 100 ||
    Math.abs(totalFormulaWeight - 100) > 0.001
  ) {
    throw new InvalidEvaluationItemsError('A fórmula da sessão deve somar 100%.');
  }
}
