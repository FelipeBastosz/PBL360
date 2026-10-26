export interface SessionRow {
  id: string;
  problemId: string;
  performanceTableId: string;
  usesDefaultTable: boolean;
  title: string;
  description: string | null;
  date: string;
  orderIndex: number;
  status: string;
  selfEvalReleased: boolean;
  peerEvalReleased: boolean;
  selfEvalDeadline: Date | null;
  peerEvalDeadline: Date | null;
  releasedAt: Date | null;
  releasedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const SESSION_COLUMNS = `
  id,
  problem_id AS "problemId",
  performance_table_id AS "performanceTableId",
  uses_default_table AS "usesDefaultTable",
  title,
  description,
  to_char(date, 'YYYY-MM-DD') AS date,
  order_index AS "orderIndex",
  status,
  self_eval_released AS "selfEvalReleased",
  peer_eval_released AS "peerEvalReleased",
  self_eval_deadline AS "selfEvalDeadline",
  peer_eval_deadline AS "peerEvalDeadline",
  released_at AS "releasedAt",
  released_by AS "releasedBy",
  created_at AS "createdAt",
  updated_at AS "updatedAt"`;
