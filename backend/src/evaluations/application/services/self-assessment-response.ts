import type { EvaluationDetail } from '../../domain/repositories/evaluation.repository';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type { GetSelfAssessmentOutput } from '../use-cases/get-self-assessment.use-case';
import type { StudentSelfAssessmentStatus } from './student-self-assessment-status';

export function toSelfAssessmentOutput(
  status: StudentSelfAssessmentStatus,
  deadline: Date | null,
  detail: EvaluationDetail,
): GetSelfAssessmentOutput {
  const evaluation = detail.evaluation;
  return {
    status,
    deadline,
    submittedAt: evaluation?.submittedAt ?? null,
    criteria: detail.config.criteria.map(toCriterion),
    items: (evaluation?.items ?? []).map((item) => ({
      criterionId: item.criterionId,
      score: item.score,
    })),
    ...(evaluation?.status === EvaluationStatus.SUBMITTED && evaluation.sessionScore !== null
      ? { consolidatedScore: evaluation.sessionScore }
      : {}),
  };
}

function toCriterion(criterion: EvaluationDetail['config']['criteria'][number]) {
  return {
    id: criterion.id,
    name: criterion.name,
    weight: criterion.weight,
    maxScore: 10,
  };
}
