import type { Evaluation } from '../entities/evaluation.entity';
import type { SessionEvaluationConfig } from '../entities/session-evaluation-config.entity';
import { EvaluationStatus } from '../enums/evaluation-status.enum';
import { SessionGradeCalculator } from './session-grade-calculator';

export function recalculateEvaluation(
  evaluation: Evaluation | null,
  config: SessionEvaluationConfig,
  tutor = true,
): Evaluation | null {
  if (evaluation?.status !== EvaluationStatus.SUBMITTED) return evaluation;
  if (!tutor && config.criteria.every((criterion) => criterion.weight === 0)) return evaluation;
  evaluation.sessionScore = SessionGradeCalculator.calculate(
    evaluation.items,
    config.criteria,
    evaluation.appliedBonus,
    tutor,
    config.formula,
  );
  return evaluation;
}
