import { ConflictError, NotFoundError } from '@/shared/errors/application.error';
import type { EvaluationAdjustment } from '../../domain/entities/grade-adjustment.entity';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type { SelfAssessmentAdjustmentHistory } from '../../domain/repositories/self-assessment-adjustment.repository';
import { SelfAssessmentAdjustmentRules } from '../../domain/services/self-assessment-adjustment-rules';
import { validateEvaluationRules } from './evaluation-rule-validation';

export interface PlannedAdjustment {
  evaluationId: string;
  originalScore: number;
  previousValue: number;
  newValue: number;
  justification: string;
}

export interface SelfAssessmentAdjustmentsOutput {
  originalScore: number | null;
  currentScore: number | null;
  adjustments: EvaluationAdjustment[];
}

export interface AdjustedSelfAssessmentOutput {
  originalScore: number;
  currentScore: number;
  adjustment: EvaluationAdjustment;
}

export function planSelfAssessmentAdjustment(
  history: SelfAssessmentAdjustmentHistory | null,
  newScore: number,
  justification: string,
): PlannedAdjustment {
  const { evaluationId, originalScore, adjustments } = assertSubmitted(history);
  const currentScore = SelfAssessmentAdjustmentRules.currentScore(originalScore, adjustments);
  assertValidAdjustment(currentScore, newScore, justification);
  return {
    evaluationId,
    originalScore,
    previousValue: currentScore,
    newValue: newScore,
    justification: justification.trim(),
  };
}

export function summarizeSelfAssessmentAdjustments(
  history: SelfAssessmentAdjustmentHistory | null,
): SelfAssessmentAdjustmentsOutput {
  if (!history) throw new NotFoundError('Autoavaliação não encontrada.');
  const { originalScore, adjustments } = history;
  const currentScore =
    originalScore === null
      ? null
      : SelfAssessmentAdjustmentRules.currentScore(originalScore, adjustments);
  return { originalScore, currentScore, adjustments };
}

function assertSubmitted(
  history: SelfAssessmentAdjustmentHistory | null,
): SelfAssessmentAdjustmentHistory & { originalScore: number } {
  if (!history) throw new NotFoundError('Autoavaliação não encontrada.');
  const { originalScore } = history;
  if (history.status !== EvaluationStatus.SUBMITTED || originalScore === null) {
    throw new ConflictError('A autoavaliação ainda não foi enviada.');
  }
  return { ...history, originalScore };
}

function assertValidAdjustment(
  currentScore: number,
  newScore: number,
  justification: string,
): void {
  validateEvaluationRules(() => {
    SelfAssessmentAdjustmentRules.assertJustification(justification);
    SelfAssessmentAdjustmentRules.assertNewScore(currentScore, newScore);
  });
}
