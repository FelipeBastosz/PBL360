const LATEST_DECIDED_ROUNDS = `
  SELECT DISTINCT ON (pr.student_id)
         pr.id, pr.student_id AS "studentId", pr.round_number AS "roundNumber",
         pr.average, pr.final_grade AS "finalGrade", pr.adjusted,
         pr.justification, pr.decided_at AS "decidedAt", pr.decided_by AS "decidedById",
         ps.anonymous
    FROM poker_rounds pr
    JOIN poker_sessions ps ON ps.id = pr.poker_id
   WHERE ps.session_id = $1 AND pr.status = 'DECIDED'
`;

const ROUND_CURRENT_GRADE = `
  SELECT r.*, latest.new_value AS "currentGrade",
         (SELECT COUNT(*) FROM grade_adjustments ga WHERE ga.poker_round_id = r.id)::int
           AS "adjustmentCount",
         (SELECT COUNT(*) FROM poker_votes pv WHERE pv.round_id = r.id)::int AS "voteCount",
         u.name AS "decidedByName"
    FROM rounds r
    LEFT JOIN users u ON u.id = r."decidedById"
    LEFT JOIN LATERAL (
      SELECT ga.new_value FROM grade_adjustments ga
       WHERE ga.poker_round_id = r.id
       ORDER BY ga.created_at DESC, ga.id DESC LIMIT 1
    ) latest ON TRUE
`;

export const FIND_SESSION_DECIDED_POKER_ROUNDS_QUERY = `
  WITH rounds AS (
    ${LATEST_DECIDED_ROUNDS}
     ORDER BY pr.student_id, pr.decided_at DESC, pr.id DESC
  )
  ${ROUND_CURRENT_GRADE};
`;

export const FIND_STUDENT_DECIDED_POKER_ROUND_QUERY = `
  WITH rounds AS (
    ${LATEST_DECIDED_ROUNDS}
       AND pr.student_id = $2
     ORDER BY pr.student_id, pr.decided_at DESC, pr.id DESC
  )
  ${ROUND_CURRENT_GRADE};
`;

export const FIND_POKER_ROUND_VOTES_QUERY = `
  SELECT pv.voter_id AS "voterId", u.name AS "voterName", pv.score, pv.voted_at AS "votedAt"
    FROM poker_votes pv
    JOIN users u ON u.id = pv.voter_id
   WHERE pv.round_id = $1
   ORDER BY pv.voted_at ASC, pv.id ASC;
`;

export const FIND_POKER_ADJUSTMENTS_DETAIL_QUERY = `
  SELECT ga.previous_value AS "previousValue", ga.new_value AS "newValue",
         ga.justification, ga.created_by AS "authorId", u.name AS "authorName",
         ga.created_at AS "createdAt"
    FROM grade_adjustments ga
    JOIN users u ON u.id = ga.created_by
   WHERE ga.poker_round_id = $1
   ORDER BY ga.created_at DESC, ga.id DESC;
`;
