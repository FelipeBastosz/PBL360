import type { EntityManager } from 'typeorm';
import type { Evaluation } from '../../domain/entities/evaluation.entity';
import type { SessionEvaluationConfig } from '../../domain/entities/session-evaluation-config.entity';
import type { SessionEvaluationCriterion } from '../../domain/entities/session-evaluation-criterion.entity';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';

interface CriterionRow extends Omit<SessionEvaluationCriterion, 'weight' | 'maxScore'> {
  weight: string;
  maxScore: string;
}

// Student submissions keep their original item set if a future session gains or loses criteria.
export async function readSubmittedConfig(
  manager: EntityManager,
  sessionId: string,
  evaluation: Evaluation | null,
  config: SessionEvaluationConfig,
): Promise<SessionEvaluationConfig> {
  if (evaluation?.status !== EvaluationStatus.SUBMITTED) return config;
  const criteria = await manager.query<CriterionRow[]>(SUBMITTED_CRITERIA, [
    sessionId,
    evaluation.id,
  ]);
  return {
    ...config,
    criteria: criteria.map((row) => ({
      ...row,
      weight: Number(row.weight),
      maxScore: Number(row.maxScore),
    })),
  };
}

const SUBMITTED_CRITERIA = `SELECT pc.id, pc.name, pc.description, COALESCE(sec.weight, pc.weight) AS weight,
            pc.max_score AS "maxScore", pc.order_index AS "orderIndex"
       FROM evaluation_items ei JOIN performance_criteria pc ON pc.id = ei.criterion_id
       LEFT JOIN session_evaluation_criteria sec ON sec.session_id = $1 AND sec.criterion_id = pc.id
      WHERE ei.evaluation_id = $2 ORDER BY pc.order_index, pc.id;`;
