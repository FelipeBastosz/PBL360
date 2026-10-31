import { ConflictError, NotFoundError } from '@/shared/errors/application.error';
import type { EvaluationAdjustment } from '../../domain/entities/grade-adjustment.entity';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type {
  AdjustmentTarget,
  SelfAssessmentAdjustmentHistory,
} from '../../domain/repositories/self-assessment-adjustment.repository';
import { SelfAssessmentAdjustmentRules } from '../../domain/services/self-assessment-adjustment-rules';
import { validateEvaluationRules } from './evaluation-rule-validation';

export interface PlannedAdjustment {
  evaluationId?: string;
  pokerRoundId?: string;
  sessionId?: string;
  studentId?: string;
  originalScore: number;
  previousValue: number;
  newValue: number;
  justification: string;
  tipo?: AdjustmentTarget;
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

const buildPlanned = (
  t: SelfAssessmentAdjustmentHistory & { originalScore: number },
  previousValue: number,
  newValue: number,
  justification: string,
  tipo?: AdjustmentTarget,
): PlannedAdjustment => ({
  evaluationId: t.evaluationId,
  pokerRoundId: t.pokerRoundId,
  sessionId: t.sessionId,
  studentId: t.studentId,
  originalScore: t.originalScore,
  previousValue,
  newValue,
  justification: justification.trim(),
  tipo: t.tipo ?? tipo,
});

export function planSelfAssessmentAdjustment(
  history: SelfAssessmentAdjustmentHistory | null,
  newScore: number,
  justification: string,
  tipo?: AdjustmentTarget,
): PlannedAdjustment {
  const target = assertSubmitted(history, tipo);
  const current = SelfAssessmentAdjustmentRules.currentScore(
    target.originalScore,
    target.adjustments,
  );
  assertValidAdjustment(current, newScore, justification);
  return buildPlanned(target, current, newScore, justification, tipo);
}

export function summarizeSelfAssessmentAdjustments(
  history: SelfAssessmentAdjustmentHistory | null,
  tipo?: AdjustmentTarget,
): SelfAssessmentAdjustmentsOutput {
  if (!history) {
    throw new NotFoundError(notFoundMessage(tipo));
  }
  const { originalScore, adjustments } = history;
  const currentScore =
    originalScore === null
      ? null
      : SelfAssessmentAdjustmentRules.currentScore(originalScore, adjustments);
  return { originalScore, currentScore, adjustments };
}

function assertSubmitted(
  history: SelfAssessmentAdjustmentHistory | null,
  tipo?: AdjustmentTarget,
): SelfAssessmentAdjustmentHistory & { originalScore: number } {
  const effectiveTipo = history?.tipo ?? tipo;
  if (!history) {
    throw new NotFoundError(notFoundMessage(effectiveTipo));
  }
  const { originalScore } = history;
  if (history.status !== EvaluationStatus.SUBMITTED || originalScore === null) {
    throw new ConflictError(notSubmittedMessage(effectiveTipo));
  }
  return { ...history, originalScore };
}

const notFoundMessage = (tipo?: AdjustmentTarget) =>
  tipo === 'PARES' ? 'Avaliação entre pares não encontrada.' : 'Autoavaliação não encontrada.';

const notSubmittedMessage = (tipo?: AdjustmentTarget) =>
  tipo === 'PARES'
    ? 'A avaliação entre pares ainda não foi finalizada.'
    : 'A autoavaliação ainda não foi enviada.';

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
