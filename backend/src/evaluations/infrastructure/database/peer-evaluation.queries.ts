export const IS_STUDENT_PARTICIPATING = `
  SELECT 1 FROM attendances
   WHERE session_id = $1
     AND student_id = $2
     AND status IN ('PRESENT', 'LATE');
`;

export const LIST_SESSION_PEERS = `
  SELECT u.id AS "alunoId", u.name AS "nome", e.status AS "status"
    FROM attendances a
    JOIN users u ON u.id = a.student_id
    LEFT JOIN evaluations e ON e.session_id = a.session_id
      AND e.evaluator_id = $2
      AND e.student_id = a.student_id
      AND e.type = 'PEER_ASSESSMENT'
   WHERE a.session_id = $1
     AND a.status IN ('PRESENT', 'LATE')
     AND a.student_id <> $2
   ORDER BY u.name, u.id;
`;

export const FIND_PEER_STUDENT = `
  SELECT u.id, u.name
    FROM users u
    JOIN attendances a ON a.student_id = u.id AND a.session_id = $1
   WHERE u.id = $2 AND a.status IN ('PRESENT', 'LATE');
`;

export const FIND_PEER_EVALUATION = `
  SELECT id, status, submitted_at AS "submittedAt", session_score AS "sessionScore",
         applied_bonus AS "appliedBonus", calculation_version AS "calculationVersion",
         created_by AS "createdBy", created_at AS "createdAt",
         updated_by AS "updatedBy", updated_at AS "updatedAt"
    FROM evaluations
   WHERE session_id = $1 AND evaluator_id = $2 AND student_id = $3 AND type = 'PEER_ASSESSMENT';
`;

export const FIND_PEER_ITEMS = `
  SELECT id, criterion_id AS "criterionId", score
    FROM evaluation_items
   WHERE evaluation_id = $1 ORDER BY criterion_id;
`;

export const INSERT_INITIAL_PEER_EVALUATION = `
  INSERT INTO evaluations (
    evaluator_id, student_id, problem_id, session_id, config_session_id, performance_table_id,
    type, status, created_by
  )
  VALUES ($1, $2, $3, $4, $4, $5, 'PEER_ASSESSMENT', 'DRAFT', $1)
  ON CONFLICT (session_id, evaluator_id, student_id) WHERE type = 'PEER_ASSESSMENT'
  DO NOTHING
  RETURNING id;
`;

export const UPDATE_PEER_SUBMISSION = `
  UPDATE evaluations
     SET status = 'SUBMITTED',
         submitted_at = $2,
         session_score = $3,
         applied_bonus = NULL,
         calculation_version = $4,
         updated_by = $1,
         updated_at = $2
   WHERE id = $5;
`;

export const UPDATE_PEER_DRAFT = `
  UPDATE evaluations
     SET updated_by = $1,
         updated_at = $2
   WHERE id = $3;
`;
