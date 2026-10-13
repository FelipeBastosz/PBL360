export const ROUND_COLUMNS = `
  id, poker_id AS "pokerId", student_id AS "studentId", round_number AS "number", status,
  seats, average::float8 AS average, final_grade::float8 AS "finalGrade", adjusted,
  justification, decided_by AS "decidedBy", decided_at AS "decidedAt"`;

export const INSERT_ROUND_SQL = `
  INSERT INTO poker_rounds (poker_id, student_id, round_number, seats)
  VALUES ($1, $2, $3, $4::jsonb) RETURNING ${ROUND_COLUMNS};`;

export const UPDATE_QUEUE_SQL = `UPDATE poker_sessions SET queue = $2::uuid[] WHERE id = $1;`;

export const DELETE_OPEN_ROUND_SQL = `
  DELETE FROM poker_rounds WHERE id = $1 AND status <> 'DECIDED' RETURNING id;`;

export const REVEAL_ROUND_SQL = `
  UPDATE poker_rounds SET status = 'REVEALED', average = $2
   WHERE id = $1 AND status = 'VOTING' RETURNING id;`;

export const RESTART_ROUND_SQL = `
  UPDATE poker_rounds SET status = 'VOTING', average = NULL, seats = $2::jsonb
   WHERE id = $1 AND status = 'REVEALED' RETURNING id;`;

export const DECIDE_ROUND_SQL = `
  UPDATE poker_rounds
     SET status = 'DECIDED', final_grade = $2, adjusted = $3, justification = $4,
         decided_by = $5, decided_at = $6
   WHERE id = $1 AND status = 'REVEALED' RETURNING id;`;

export const CAST_VOTE_SQL = `
  INSERT INTO poker_votes (round_id, voter_id, score)
  SELECT $1, $2, $3
   WHERE EXISTS (SELECT 1 FROM poker_rounds WHERE id = $1 AND status = 'VOTING')
  ON CONFLICT ON CONSTRAINT uq_poker_votes_round_voter
  DO UPDATE SET score = EXCLUDED.score, voted_at = now()
  RETURNING id;`;

export const FIND_VOTES_SQL = `
  SELECT voter_id AS "voterId", score::float8 AS score
    FROM poker_votes WHERE round_id = $1 ORDER BY voted_at, id;`;
