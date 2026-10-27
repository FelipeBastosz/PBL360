import {
  InvalidEvaluationItemsError,
  InvalidEvaluationJustificationError,
} from '../errors/invalid-evaluation.error';

export interface CriterionScore {
  criterionId: string;
  score: number;
}

export type ScoringCriterion = string | { id: string };

export class EvaluationRules {
  static assertValidItems(
    items: readonly CriterionScore[],
    criteria: readonly ScoringCriterion[],
    requireComplete: boolean,
  ): void {
    const allowedIds = new Set(
      criteria.map((criterion) => (typeof criterion === 'string' ? criterion : criterion.id)),
    );
    const receivedIds = new Set(items.map((item) => item.criterionId));

    this.assertUniqueItems(items, receivedIds);
    items.forEach((item) => this.assertValidItem(item, allowedIds));

    if (requireComplete) {
      this.assertComplete(receivedIds, allowedIds);
    }
  }

  private static assertUniqueItems(
    items: readonly CriterionScore[],
    receivedIds: ReadonlySet<string>,
  ): void {
    if (receivedIds.size !== items.length) {
      throw new InvalidEvaluationItemsError('A avaliação não pode repetir um critério.');
    }
  }

  private static assertValidItem(item: CriterionScore, allowedIds: ReadonlySet<string>): void {
    if (!allowedIds.has(item.criterionId)) {
      throw new InvalidEvaluationItemsError(
        'Um dos critérios não pertence à configuração desta avaliação.',
      );
    }

    if (!Number.isFinite(item.score) || item.score < 0 || item.score > 10) {
      throw new InvalidEvaluationItemsError('A nota do critério deve estar entre 0 e 10.');
    }
  }

  private static assertComplete(
    receivedIds: ReadonlySet<string>,
    allowedIds: ReadonlySet<string>,
  ): void {
    if (allowedIds.size === 0) {
      throw new InvalidEvaluationItemsError('Não é possível enviar uma avaliação sem critérios.');
    }

    if ([...allowedIds].some((id) => !receivedIds.has(id))) {
      throw new InvalidEvaluationItemsError(
        'Preencha todos os critérios antes de enviar a avaliação.',
      );
    }
  }

  static assertAdjustmentJustification(justification?: string): void {
    const text = justification?.trim() ?? '';

    if (text.length < 10 || text.length > 500) {
      throw new InvalidEvaluationJustificationError(
        'Para alterar uma nota enviada, informe uma justificativa entre 10 e 500 caracteres.',
      );
    }
  }
}
