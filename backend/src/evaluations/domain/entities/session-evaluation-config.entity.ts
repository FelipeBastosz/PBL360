import type { SessionEvaluationCriterion } from './session-evaluation-criterion.entity';

export interface SessionEvaluationConfig {
  tableId: string;
  tableName: string;
  criteria: SessionEvaluationCriterion[];
  frozen: boolean;
}
