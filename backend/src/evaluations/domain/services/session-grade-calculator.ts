import { InvalidEvaluationItemsError } from '../errors/invalid-evaluation.error';
import type { SessionEvaluationCriterion } from '../entities/session-evaluation-criterion.entity';
import { EvaluationRules, type CriterionScore } from './evaluation-rules';

export const SESSION_CALCULATION_VERSION = 'WEIGHTED_CRITERIA_CARGO_70_30_V2';

export class SessionGradeCalculator {
  static calculate(
    items: readonly CriterionScore[],
    criteria: readonly SessionEvaluationCriterion[],
    bonus: number | null,
    applyCargoFormula = false,
  ): number {
    EvaluationRules.assertValidItems(
      items,
      criteria.map((criterion) => criterion.id),
      true,
    );
    this.assertConfiguration(criteria, bonus);
    return this.weightedResult(items, criteria, bonus, applyCargoFormula);
  }

  private static weightedResult(
    items: readonly CriterionScore[],
    criteria: readonly SessionEvaluationCriterion[],
    bonus: number | null,
    applyCargoFormula: boolean,
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
    return this.toGrade(weighted, total, bonus, applyCargoFormula);
  }

  private static toGrade(
    weighted: bigint,
    total: bigint,
    bonus: number | null,
    applyCargoFormula: boolean,
  ): number {
    const cargoScoreCents = BigInt(Math.round((bonus ?? 0) * 1000));
    const usesCargoFormula = applyCargoFormula && bonus !== null;
    const numerator = usesCargoFormula ? weighted * 7n + cargoScoreCents * total * 3n : weighted;
    const denominator = usesCargoFormula ? total * 10n : total;
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
  ): void {
    if (bonus !== null && (!Number.isFinite(bonus) || bonus < 0 || bonus > 1)) {
      throw new InvalidEvaluationItemsError('O adicional de papel deve estar entre 0 e 1.');
    }
    if (
      criteria.some(
        (criterion) =>
          !Number.isFinite(criterion.weight) || criterion.weight < 0 || criterion.weight > 10,
      )
    ) {
      throw new InvalidEvaluationItemsError('Os pesos dos critérios devem estar entre 0 e 10.');
    }
  }
}
