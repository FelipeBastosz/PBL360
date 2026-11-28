export const FIND_STUDENT_SESSION_DETAILS_QUERY = `
  SELECT s.id AS "sessionId",
         a.status AS attendance,
         COALESCE(mark_counts.marks, '[]'::json) AS marks,
         to_char(s.date, 'YYYY-MM-DD') AS date,
         p.order_index AS "problemOrderIndex",
         s.order_index AS "sessionOrderIndex"
    FROM problems p
    JOIN sessions s ON s.problem_id = p.id
    LEFT JOIN attendances a
      ON a.session_id = s.id AND a.student_id = $2
    LEFT JOIN LATERAL (
      SELECT json_agg(
               json_build_object('id', counts.id, 'name', counts.name, 'quantity', counts.quantity)
               ORDER BY counts.name, counts.id
             ) AS marks
        FROM (
          SELECT t.id, t.name, COUNT(*)::int AS quantity
            FROM observations o
            JOIN observation_tags ot ON ot.observation_id = o.id
            JOIN behavior_tags t ON t.id = ot.tag_id
           WHERE o.session_id = s.id AND o.student_id = $2
           GROUP BY t.id, t.name
        ) counts
    ) mark_counts ON TRUE
   WHERE p.room_id = $1 AND p.id = ANY($3::uuid[]);`;
