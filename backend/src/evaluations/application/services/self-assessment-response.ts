import type { EvaluationDetail } from '../../domain/repositories/evaluation.repository';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type { GetSelfAssessmentOutput } from '../use-cases/get-self-assessment.use-case';
import type { StudentSelfAssessmentStatus } from './student-self-assessment-status';

export function toSelfAssessmentOutput(
  status: StudentSelfAssessmentStatus,
  deadline: Date | null,
  detail: EvaluationDetail,
): GetSelfAssessmentOutput {
  const evalData = detail.evaluation;
  return {
    status,
    deadline,
    submittedAt: evalData?.submittedAt ?? null,
    criteria: detail.config.criteria.map(toCriterion),
    items: toItems(evalData),
    papel: detail.papel ?? null,
    notaCargo: evalData?.appliedBonus ?? null,
    formula: detail.config.formula ?? { criteriaWeight: 70, roleWeight: 30 },
    ...toConsolidatedScore(evalData),
  };
}

const toItems = (evaluation: EvaluationDetail['evaluation']) =>
  (evaluation?.items ?? []).map((item) => ({
    criterionId: item.criterionId,
    score: item.score,
  }));

const toConsolidatedScore = (evaluation: EvaluationDetail['evaluation']) =>
  evaluation?.status === EvaluationStatus.SUBMITTED && evaluation.sessionScore !== null
    ? { consolidatedScore: evaluation.sessionScore }
    : {};

function toCriterion(criterion: EvaluationDetail['config']['criteria'][number]) {
  return {
    id: criterion.id,
    name: criterion.name,
    weight: criterion.weight,
    maxScore: 10,
  };
}
