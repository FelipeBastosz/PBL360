import {
  PEER_RECEIVED_SCORES_QUERY,
  SELF_ASSESSMENT_SCORES_QUERY,
  SESSION_BONUSES_QUERY,
  SESSION_SCORES_QUERY,
} from './evaluation-grade.queries';

export interface GradeQuery {
  sql: string;
  params: unknown[];
}

export function buildProblemQueries(roomId: string, problemId: string): GradeQuery[] {
  const subQuery = 'SELECT id FROM sessions WHERE problem_id = $1';
  return [
    ...baseQueries(roomId, problemId),
    ...gradeQueries(problemId, subQuery),
    ...criteriaQueries(problemId),
    { sql: SELF_ASSESSMENT_SCORES_QUERY, params: [problemId] },
    { sql: PEER_RECEIVED_SCORES_QUERY, params: [problemId] },
  ];
}

function criteriaQueries(problemId: string): GradeQuery[] {
  return [
    {
      sql: `SELECT s.id AS session_id, COALESCE(sec.criterion_id, pc.id) AS id,
                   COALESCE(sec.weight, pc.weight) AS weight
              FROM sessions s
              LEFT JOIN session_evaluation_configs cfg ON cfg.session_id = s.id
              LEFT JOIN session_evaluation_criteria sec ON sec.session_id = s.id
              LEFT JOIN performance_criteria pc
                ON cfg.session_id IS NULL
               AND pc.performance_table_id = s.performance_table_id AND pc.deleted_at IS NULL
             WHERE s.problem_id = $1
             ORDER BY s.order_index, COALESCE(sec.order_index, pc.order_index);`,
      params: [problemId],
    },
  ];
}

function baseQueries(roomId: string, problemId: string): GradeQuery[] {
  return [
    {
      sql: `SELECT id, title, date, order_index, self_eval_released, peer_eval_released,
                   (EXTRACT(EPOCH FROM self_eval_deadline) * 1000)::float8 AS self_eval_deadline_ms,
                   (EXTRACT(EPOCH FROM peer_eval_deadline) * 1000)::float8 AS peer_eval_deadline_ms
              FROM sessions WHERE problem_id = $1 ORDER BY order_index, id`,
      params: [problemId],
    },
    {
      sql: `SELECT u.id, u.name, u.registration_number AS matricula FROM room_students r JOIN users u ON u.id = r.student_id WHERE r.room_id = $1 AND u.type = 'STUDENT' ORDER BY u.name, u.id`,
      params: [roomId],
    },
    formulaQuery(problemId),
  ];
}

function formulaQuery(problemId: string): GradeQuery {
  return {
    sql: `SELECT id, scope, CASE WHEN is_default THEN NULL ELSE version END AS version,
                  session_id, is_default
            FROM formulas
           WHERE problem_id = $1 AND scope = 'PROBLEMA' AND active = TRUE
          UNION ALL
          SELECT f.id, f.scope,
                 CASE WHEN f.is_default THEN NULL ELSE f.version END AS version,
                 f.session_id, f.is_default
            FROM formulas f
            JOIN sessions s ON s.id = f.session_id
           WHERE s.problem_id = $1 AND f.scope = 'SESSAO' AND f.active = TRUE`,
    params: [problemId],
  };
}

function gradeQueries(problemId: string, subQuery: string): GradeQuery[] {
  return [
    {
      sql: SESSION_SCORES_QUERY,
      params: [problemId],
    },
    {
      sql: `SELECT session_id, student_id, status FROM attendances WHERE session_id IN (${subQuery})`,
      params: [problemId],
    },
    {
      sql: SESSION_BONUSES_QUERY,
      params: [problemId],
    },
  ];
}
