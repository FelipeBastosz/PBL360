import { InvalidAdjustmentError } from '../errors/invalid-evaluation.error';
import type { EvaluationAdjustment } from '../entities/grade-adjustment.entity';

export class SelfAssessmentAdjustmentRules {
  static currentScore(
    originalScore: number,
    adjustmentsLatestFirst: readonly EvaluationAdjustment[],
  ): number {
    return adjustmentsLatestFirst[0]?.newValue ?? originalScore;
  }

  static assertNewScore(currentScore: number, newScore: number): void {
    if (currentScore === newScore) {
      throw new InvalidAdjustmentError('A nova nota deve ser diferente da nota vigente.');
    }
  }

  static assertJustification(justification: string): void {
    const length = justification.trim().length;

    if (length < 10 || length > 500) {
      throw new InvalidAdjustmentError('A justificativa deve ter entre 10 e 500 caracteres.');
    }
  }
}
