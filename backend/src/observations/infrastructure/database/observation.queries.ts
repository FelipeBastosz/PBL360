export const REGISTRATION_CONTEXT_QUERY = `
  SELECT
    EXISTS (
      SELECT 1 FROM room_students WHERE room_id = $1 AND student_id = $2
    ) AS "studentEnrolled",
    COALESCE(
      (SELECT json_agg(json_build_object('id', id, 'name', name) ORDER BY name)
         FROM behavior_tags
        WHERE id = ANY($4::uuid[])
          AND active
          AND (tutor_id IS NULL OR tutor_id = $3)),
      '[]'::json
    ) AS "usableTags";`;

// Observação e ligações com as marcações numa única ida ao banco: o requisito
// da issue é registrar em até 3s, e cada toque num chip é uma chamada.
export const CREATE_OBSERVATION_QUERY = `
  WITH created AS (
    INSERT INTO observations (session_id, student_id, author_id, text)
    VALUES ($1, $2, $3, $4)
    RETURNING id, created_at
  ), linked AS (
    INSERT INTO observation_tags (observation_id, tag_id)
    SELECT created.id, tag_id FROM created, unnest($5::uuid[]) AS tag_id
  )
  SELECT id, created_at AS "createdAt" FROM created;`;

const SELECT_OBSERVATIONS = `
  SELECT o.id,
         o.session_id AS "sessionId",
         o.student_id AS "studentId",
         o.author_id AS "authorId",
         o.text,
         o.created_at AS "createdAt",
         COALESCE(
           json_agg(json_build_object('id', t.id, 'name', t.name) ORDER BY t.name)
             FILTER (WHERE t.id IS NOT NULL),
           '[]'::json
         ) AS tags
    FROM observations o
    LEFT JOIN observation_tags ot ON ot.observation_id = o.id
    LEFT JOIN behavior_tags t ON t.id = ot.tag_id`;

export const FIND_OBSERVATION_BY_ID_QUERY = `${SELECT_OBSERVATIONS}
   WHERE o.id = $1
   GROUP BY o.id;`;

export const FIND_STUDENT_SESSION_OBSERVATIONS_QUERY = `${SELECT_OBSERVATIONS}
   WHERE o.session_id = $1 AND o.student_id = $2
   GROUP BY o.id
   ORDER BY o.created_at DESC;`;
