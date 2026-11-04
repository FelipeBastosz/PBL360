export const FIND_PROBLEM_OBSERVATION_TAGS_QUERY = `
  SELECT o.student_id AS "studentId",
         s.id AS "sessionId",
         s.title AS "sessionTitle",
         s.order_index AS "sessionOrderIndex",
         COALESCE(
           json_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
           '[]'::json
         ) AS tags
    FROM observations o
    JOIN sessions s ON s.id = o.session_id
    LEFT JOIN observation_tags ot ON ot.observation_id = o.id
    LEFT JOIN behavior_tags t ON t.id = ot.tag_id
   WHERE s.problem_id = $1
   GROUP BY o.student_id, s.id, s.title, s.order_index
   HAVING COUNT(t.id) > 0
   ORDER BY s.order_index ASC NULLS LAST, s.id ASC, o.student_id ASC;
`;
