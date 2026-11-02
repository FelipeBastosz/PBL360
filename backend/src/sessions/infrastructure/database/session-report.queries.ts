export const FIND_SESSION_HEADER_QUERY = `
  SELECT s.id AS "sessionId",
         s.title AS "sessionTitle",
         s.order_index AS "sessionOrderIndex",
         s.date AS "sessionDate",
         p.id AS "problemId",
         p.title AS "problemTitle",
         p.order_index AS "problemOrderIndex",
         r.id AS "roomId",
         r.name AS "roomName",
         r.course_code AS "courseCode",
         r.semester AS "semester"
    FROM sessions s
    JOIN problems p ON p.id = s.problem_id
    JOIN rooms r ON r.id = p.room_id
   WHERE s.id = $1;
`;

export const FIND_ROOM_STUDENTS_QUERY = `
  SELECT u.id AS "studentId",
         u.name,
         u.registration_number AS "matricula"
    FROM room_students rs
    JOIN users u ON u.id = rs.student_id
   WHERE rs.room_id = $1
   ORDER BY u.name ASC, u.id ASC;
`;

export const FIND_SESSION_ATTENDANCES_QUERY = `
  SELECT student_id AS "studentId",
         status
    FROM attendances
   WHERE session_id = $1;
`;

export const FIND_SESSION_ROLES_QUERY = `
  SELECT student_id AS "studentId",
         role,
         role_score AS "roleScore"
    FROM session_roles
   WHERE session_id = $1;
`;

export const FIND_SESSION_OBSERVATION_TAGS_QUERY = `
  SELECT o.student_id AS "studentId",
         COALESCE(
           json_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
           '[]'::json
         ) AS tags
    FROM observations o
    LEFT JOIN observation_tags ot ON ot.observation_id = o.id
    LEFT JOIN behavior_tags t ON t.id = ot.tag_id
   WHERE o.session_id = $1
   GROUP BY o.student_id;
`;

export const FIND_SESSION_EVALUATIONS_QUERY = `
  SELECT e.id,
         e.student_id AS "studentId",
         e.status,
         e.applied_bonus AS "appliedBonus"
    FROM evaluations e
   WHERE e.session_id = $1 AND e.type = 'TUTOR_SESSION';
`;

export const FIND_SESSION_FEEDBACKS_QUERY = `
  SELECT f.id,
         f.destinatario_id AS "recipientId",
         f.texto AS "text",
         COALESCE(u.name, 'Professor') AS "authorName"
    FROM feedback f
    LEFT JOIN LATERAL (
      SELECT r.edited_by
        FROM feedback_revisions r
       WHERE r.feedback_id = f.id
       ORDER BY r.edited_at DESC
       LIMIT 1
    ) latest_rev ON TRUE
    LEFT JOIN users u ON u.id = COALESCE(latest_rev.edited_by, f.autor_id)
   WHERE f.sessao_id = $1 AND f.escopo = 'SESSAO'
   ORDER BY f.criado_em ASC;
`;
