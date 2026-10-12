export const STUDENT_EVALUATION_COUNTS = `
  SELECT
    EXISTS (SELECT 1 FROM attendances
             WHERE session_id = $1 AND student_id = $2 AND status IN ('PRESENT', 'LATE'))
      AS participating,
    (SELECT COUNT(*)::int FROM evaluations
      WHERE session_id = $1 AND evaluator_id = $2
        AND type = 'PEER_ASSESSMENT' AND status = 'SUBMITTED') AS "peerSubmitted",
    GREATEST((SELECT COUNT(*)::int FROM attendances
               WHERE session_id = $1 AND status IN ('PRESENT', 'LATE')) -
      CASE WHEN EXISTS (SELECT 1 FROM attendances
                         WHERE session_id = $1 AND student_id = $2
                           AND status IN ('PRESENT', 'LATE')) THEN 1 ELSE 0 END, 0) AS "peerTotal";
`;

export const FIND_SELF_ATTENDANCE = `
  SELECT status FROM attendances
    WHERE session_id = $1 AND student_id = $2 AND status IN ('PRESENT', 'LATE') FOR SHARE;
`;

export const FIND_SELF_RELEASE = `
  SELECT self_eval_released AS released, self_eval_deadline AS deadline
    FROM sessions WHERE id = $1 FOR UPDATE;
`;

export const INSERT_SELF_EVALUATION = `
  INSERT INTO evaluations (
    evaluator_id, student_id, problem_id, session_id, config_session_id,
    performance_table_id, type, status, created_by
  ) VALUES ($1, $1, $2, $3, $3, $4, 'SELF_ASSESSMENT', 'DRAFT', $1)
  ON CONFLICT (session_id, student_id) WHERE type = 'SELF_ASSESSMENT' DO NOTHING
  RETURNING id;
`;

export const UPDATE_SELF_DRAFT = `
  UPDATE evaluations SET updated_by = $1, updated_at = $2 WHERE id = $3;
`;

export const UPDATE_SELF_SUBMISSION = `
  UPDATE evaluations SET status = 'SUBMITTED', submitted_at = $1,
    session_score = $2, applied_bonus = NULL, calculation_version = $3,
    updated_by = $4, updated_at = $1 WHERE id = $5;
`;
