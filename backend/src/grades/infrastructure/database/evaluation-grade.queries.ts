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
