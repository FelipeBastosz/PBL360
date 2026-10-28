export const FIND_SESSION_EVALUATION_RELEASES = `
  SELECT self_eval_released AS "selfEvalReleased", peer_eval_released AS "peerEvalReleased"
    FROM sessions WHERE id = $1;
`;

const SELF_ASSESSMENT_SCORE = `
  SELECT id, status, session_score AS "sessionScore" FROM evaluations
   WHERE session_id = $1 AND student_id = $2 AND type = 'SELF_ASSESSMENT'
`;
export const FIND_SELF_ASSESSMENT_SCORE = `${SELF_ASSESSMENT_SCORE};`;
export const LOCK_SELF_ASSESSMENT_SCORE = `${SELF_ASSESSMENT_SCORE} FOR UPDATE;`;

export const FIND_EVALUATION_ADJUSTMENTS = `
  SELECT ga.previous_value AS "previousValue", ga.new_value AS "newValue", ga.justification,
         ga.created_by AS "authorId", u.name AS "authorName", ga.created_at AS "createdAt"
    FROM grade_adjustments ga JOIN users u ON u.id = ga.created_by
   WHERE ga.evaluation_id = $1 ORDER BY ga.created_at DESC, ga.id DESC;
`;

export const INSERT_EVALUATION_ADJUSTMENT = `
  WITH inserted AS (
    INSERT INTO grade_adjustments
      (evaluation_id, previous_value, new_value, justification, created_by, created_at)
    VALUES ($1, $2, $3, $4, $5, clock_timestamp())
    RETURNING previous_value, new_value, justification, created_by, created_at
  )
  SELECT i.previous_value AS "previousValue", i.new_value AS "newValue", i.justification,
         i.created_by AS "authorId", u.name AS "authorName", i.created_at AS "createdAt"
    FROM inserted i JOIN users u ON u.id = i.created_by;
`;

const POKER_ROUND_SCORE = `
  SELECT pr.id, pr.status, pr.final_grade AS "sessionScore"
    FROM poker_rounds pr
    JOIN poker_sessions ps ON ps.id = pr.poker_id
   WHERE ps.session_id = $1 AND pr.student_id = $2
   ORDER BY pr.decided_at DESC NULLS LAST, pr.round_number DESC
   LIMIT 1
`;
export const FIND_POKER_ROUND_SCORE = `${POKER_ROUND_SCORE};`;
export const LOCK_POKER_ROUND_SCORE = `
  SELECT id, status, final_grade AS "sessionScore"
    FROM poker_rounds
   WHERE poker_id IN (SELECT id FROM poker_sessions WHERE session_id = $1)
     AND student_id = $2
   ORDER BY decided_at DESC NULLS LAST, round_number DESC
   LIMIT 1 FOR UPDATE;
`;

export const FIND_POKER_ADJUSTMENTS = `
  SELECT ga.previous_value AS "previousValue", ga.new_value AS "newValue", ga.justification,
         ga.created_by AS "authorId", u.name AS "authorName", ga.created_at AS "createdAt"
    FROM grade_adjustments ga JOIN users u ON u.id = ga.created_by
   WHERE ga.poker_round_id = $1 ORDER BY ga.created_at DESC, ga.id DESC;
`;

export const INSERT_POKER_ADJUSTMENT = `
  WITH inserted AS (
    INSERT INTO grade_adjustments
      (poker_round_id, previous_value, new_value, justification, created_by, created_at)
    VALUES ($1, $2, $3, $4, $5, clock_timestamp())
    RETURNING previous_value, new_value, justification, created_by, created_at
  )
  SELECT i.previous_value AS "previousValue", i.new_value AS "newValue", i.justification,
         i.created_by AS "authorId", u.name AS "authorName", i.created_at AS "createdAt"
    FROM inserted i JOIN users u ON u.id = i.created_by;
`;

const PEER_FORM_SCORES = `
  SELECT id, status, session_score AS "sessionScore"
    FROM evaluations
   WHERE session_id = $1 AND student_id = $2
     AND type = 'PEER_ASSESSMENT' AND evaluator_id <> $2
`;
export const FIND_PEER_FORM_SCORES = `${PEER_FORM_SCORES};`;
export const LOCK_PEER_FORM_SCORES = `${PEER_FORM_SCORES} FOR UPDATE;`;

export const FIND_PEER_FORM_ADJUSTMENTS = `
  SELECT ga.previous_value AS "previousValue", ga.new_value AS "newValue", ga.justification,
         ga.created_by AS "authorId", u.name AS "authorName", ga.created_at AS "createdAt"
    FROM grade_adjustments ga JOIN users u ON u.id = ga.created_by
   WHERE ga.session_id = $1 AND ga.student_id = $2 AND ga.type = 'PEER_ASSESSMENT'
   ORDER BY ga.created_at DESC, ga.id DESC;
`;

export const INSERT_PEER_FORM_ADJUSTMENT = `
  WITH inserted AS (
    INSERT INTO grade_adjustments
      (session_id, student_id, type, previous_value, new_value, justification, created_by, created_at)
    VALUES ($1, $2, 'PEER_ASSESSMENT', $3, $4, $5, $6, clock_timestamp())
    RETURNING previous_value, new_value, justification, created_by, created_at
  )
  SELECT i.previous_value AS "previousValue", i.new_value AS "newValue", i.justification,
         i.created_by AS "authorId", u.name AS "authorName", i.created_at AS "createdAt"
    FROM inserted i JOIN users u ON u.id = i.created_by;
`;
