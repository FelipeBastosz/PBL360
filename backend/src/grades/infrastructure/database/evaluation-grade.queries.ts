// Submitted tutor evaluations take precedence over the legacy criterion grade store.
export const SESSION_SCORES_QUERY = `
  SELECT e.session_id, e.student_id, ei.criterion_id, ei.score
    FROM evaluations e JOIN evaluation_items ei ON ei.evaluation_id = e.id
   WHERE e.problem_id = $1 AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
  UNION ALL
  SELECT cg.session_id, cg.student_id, cg.criterion_id, cg.score
    FROM criterion_grades cg JOIN sessions s ON s.id = cg.session_id
   WHERE s.problem_id = $1 AND NOT EXISTS (
     SELECT 1 FROM evaluations e WHERE e.session_id = cg.session_id
       AND e.student_id = cg.student_id AND e.type = 'TUTOR_SESSION'
   );
`;

// A null applied bonus is intentional: the student was submitted without a role score.
export const SESSION_BONUSES_QUERY = `
  SELECT e.session_id, e.student_id, e.applied_bonus AS bonus_score
    FROM evaluations e
   WHERE e.problem_id = $1 AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
  UNION ALL
  SELECT sr.session_id, sr.student_id, sr.role_score AS bonus_score
    FROM session_roles sr JOIN sessions s ON s.id = sr.session_id
   WHERE s.problem_id = $1 AND NOT EXISTS (
     SELECT 1 FROM evaluations e WHERE e.session_id = sr.session_id
       AND e.student_id = sr.student_id AND e.type = 'TUTOR_SESSION'
   );
`;

// The current self-assessment score is the latest tutor adjustment, falling back to the original.
export const SELF_ASSESSMENT_SCORES_QUERY = `
  SELECT e.session_id, e.student_id, COALESCE(latest.new_value, e.session_score) AS score
    FROM evaluations e
    JOIN sessions s ON s.id = e.session_id
    LEFT JOIN LATERAL (
      SELECT ga.new_value FROM grade_adjustments ga
       WHERE ga.evaluation_id = e.id
       ORDER BY ga.created_at DESC, ga.id DESC LIMIT 1
    ) latest ON TRUE
   WHERE s.problem_id = $1 AND e.type = 'SELF_ASSESSMENT' AND e.status = 'SUBMITTED';
`;

export const POKER_PEER_SCORES_QUERY = `
  SELECT DISTINCT ON (ps.session_id, pr.student_id)
         ps.session_id, pr.student_id,
         COALESCE(latest.new_value, pr.final_grade) AS score
    FROM poker_rounds pr
    JOIN poker_sessions ps ON ps.id = pr.poker_id
    JOIN sessions s ON s.id = ps.session_id
    LEFT JOIN LATERAL (
      SELECT ga.new_value FROM grade_adjustments ga
       WHERE ga.poker_round_id = pr.id
       ORDER BY ga.created_at DESC, ga.id DESC LIMIT 1
    ) latest ON TRUE
   WHERE s.problem_id = $1 AND pr.status = 'DECIDED'
   ORDER BY ps.session_id, pr.student_id, pr.decided_at DESC;
`;

export const PEER_RECEIVED_SCORES_QUERY = `
  SELECT e.session_id, e.student_id, e.session_score AS score
    FROM evaluations e
    JOIN sessions s ON s.id = e.session_id
   WHERE s.problem_id = $1 AND e.type = 'PEER_ASSESSMENT' AND e.status = 'SUBMITTED'
     AND e.evaluator_id <> e.student_id;
`;

export const PEER_ADJUSTMENTS_QUERY = `
  SELECT DISTINCT ON (ga.session_id, ga.student_id)
         ga.session_id, ga.student_id, ga.new_value AS score
    FROM grade_adjustments ga
    JOIN sessions s ON s.id = ga.session_id
   WHERE s.problem_id = $1 AND ga.type = 'PEER_ASSESSMENT'
   ORDER BY ga.session_id, ga.student_id, ga.created_at DESC, ga.id DESC;
`;
