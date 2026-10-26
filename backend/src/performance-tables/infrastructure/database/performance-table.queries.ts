export const PERFORMANCE_TABLE_SUMMARY_QUERY = `
  SELECT performance_tables.id,
         performance_tables.tutor_id AS "tutorId",
         performance_tables.room_id AS "roomId",
         performance_tables.name,
         performance_tables.description,
         performance_tables.is_default AS "isDefault",
         COUNT(DISTINCT performance_criteria.id)::int AS "criteriaCount",
         COUNT(DISTINCT sessions.problem_id)::int AS "problemCount",
         performance_tables.created_at AS "createdAt",
         performance_tables.updated_at AS "updatedAt"
    FROM performance_tables
    LEFT JOIN performance_criteria
      ON performance_criteria.performance_table_id = performance_tables.id
     AND performance_criteria.deleted_at IS NULL
    LEFT JOIN sessions
      ON sessions.performance_table_id = performance_tables.id
   WHERE (performance_tables.tutor_id = $1 OR performance_tables.is_default = TRUE)
     AND performance_tables.is_session_copy = FALSE
     AND performance_tables.deleted_at IS NULL
   GROUP BY performance_tables.id
   ORDER BY performance_tables.created_at ASC,
            performance_tables.id ASC;
`;

export const FIND_PERFORMANCE_TABLE_BY_ID_QUERY = `
  SELECT pt.id,
         pt.tutor_id AS "tutorId",
         pt.room_id AS "roomId",
         pt.source_table_id AS "sourceTableId",
         pt.is_session_copy AS "isSessionCopy",
         pt.name,
         pt.description,
         pt.is_default AS "isDefault",
         pt.created_at AS "createdAt",
         pt.updated_at AS "updatedAt",
         pt.deleted_at AS "deletedAt",
         (
           SELECT COUNT(DISTINCT s.problem_id)::int
             FROM sessions s
            WHERE s.performance_table_id = pt.id
         ) AS "problemCount",
         pc.id AS "criterionId",
         pc.name AS "criterionName",
         pc.description AS "criterionDescription",
         pc.order_index AS "criterionOrderIndex",
         pc.weight AS "criterionWeight"
    FROM performance_tables pt
    LEFT JOIN performance_criteria pc
      ON pc.performance_table_id = pt.id
     AND pc.deleted_at IS NULL
   WHERE pt.id = $1
     AND pt.deleted_at IS NULL
   ORDER BY pc.order_index ASC,
            pc.created_at ASC;
`;

export const UPDATE_PERFORMANCE_TABLE_QUERY = `
  UPDATE performance_tables
     SET name = $2,
         description = $3,
         updated_at = now()
   WHERE id = $1
     AND deleted_at IS NULL;
`;

export const INSERT_PERFORMANCE_TABLE_QUERY = `
  INSERT INTO performance_tables (
    tutor_id,
    room_id,
    name,
    description,
    is_default
  )
  VALUES ($1, $2, $3, $4, $5)
  RETURNING
    id,
    tutor_id AS "tutorId",
    room_id AS "roomId",
    source_table_id AS "sourceTableId",
    is_session_copy AS "isSessionCopy",
    name,
    description,
    is_default AS "isDefault",
    created_at AS "createdAt",
    updated_at AS "updatedAt",
    deleted_at AS "deletedAt";
`;

export const FIND_PERFORMANCE_TABLE_USAGE_QUERY = `
  WITH table_problems AS (
    SELECT DISTINCT problem_id FROM sessions WHERE performance_table_id = $1
  ),
  table_sessions AS (
    SELECT s.id, s.date
      FROM sessions s
     WHERE s.performance_table_id = $1
  )
  SELECT (SELECT COUNT(*)::int FROM table_problems) AS "problemCount",
         COUNT(*)::int AS "sessionCount",
         COUNT(*) FILTER (WHERE date <= CURRENT_DATE OR EXISTS (
           SELECT 1 FROM evaluations e WHERE e.session_id = table_sessions.id
             AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
         ))::int AS "pastSessionCount"
    FROM table_sessions;
`;

export const FIND_PERFORMANCE_TABLE_BY_ID_INCLUDING_DELETED_QUERY = `
  SELECT pt.id,
         pt.tutor_id AS "tutorId",
         pt.room_id AS "roomId",
         pt.source_table_id AS "sourceTableId",
         pt.is_session_copy AS "isSessionCopy",
         pt.name,
         pt.description,
         pt.is_default AS "isDefault",
         pt.created_at AS "createdAt",
         pt.updated_at AS "updatedAt",
         pt.deleted_at AS "deletedAt",
         (
           SELECT COUNT(DISTINCT s.problem_id)::int
             FROM sessions s
            WHERE s.performance_table_id = pt.id
         ) AS "problemCount",
         pc.id AS "criterionId",
         pc.name AS "criterionName",
         pc.description AS "criterionDescription",
         pc.order_index AS "criterionOrderIndex",
         pc.weight AS "criterionWeight"
    FROM performance_tables pt
    LEFT JOIN performance_criteria pc
      ON pc.performance_table_id = pt.id
     AND pc.deleted_at IS NULL
   WHERE pt.id = $1
   ORDER BY pc.order_index ASC,
            pc.created_at ASC;
`;

export const FIND_ROOM_PERFORMANCE_TABLES_QUERY = `
  SELECT pt.id,
         pt.name,
         pt.description,
         pt.room_id AS "roomId",
         pt.is_default AS "isDefault",
         pt.tutor_id AS "authorId",
         COALESCE(u.name, 'Sistema') AS "authorName",
         pt.created_at AS "createdAt",
         (
           SELECT COUNT(DISTINCT s.id)::int
             FROM sessions s
             JOIN problems p ON p.id = s.problem_id
             LEFT JOIN performance_tables copy ON copy.id = s.performance_table_id
             LEFT JOIN session_evaluation_configs sec ON sec.session_id = s.id
             LEFT JOIN evaluations e ON e.session_id = s.id
            WHERE p.room_id = $1
              AND (
                s.performance_table_id = pt.id
                OR copy.source_table_id = pt.id
                OR sec.performance_table_id = pt.id
                OR e.performance_table_id = pt.id
              )
         ) AS "emUso",
         pc.id AS "criterionId",
         pc.name AS "criterionName",
         pc.description AS "criterionDescription",
         pc.order_index AS "criterionOrderIndex",
         pc.weight AS "criterionWeight"
    FROM performance_tables pt
   LEFT JOIN users u ON u.id = pt.tutor_id
    LEFT JOIN performance_criteria pc
      ON pc.performance_table_id = pt.id
     AND pc.deleted_at IS NULL
   WHERE pt.deleted_at IS NULL
     AND pt.is_session_copy = FALSE
     AND (
       pt.room_id = $1
       OR EXISTS (
         SELECT 1
           FROM sessions s
           JOIN problems p ON p.id = s.problem_id
           LEFT JOIN performance_tables copy ON copy.id = s.performance_table_id
          WHERE p.room_id = $1
            AND (s.performance_table_id = pt.id OR copy.source_table_id = pt.id)
       )
       OR (pt.tutor_id = $2 AND pt.room_id IS NULL AND pt.is_default = FALSE)
       OR pt.is_default = TRUE
     )
   ORDER BY pt.created_at ASC,
            pt.id ASC,
            pc.order_index ASC,
            pc.created_at ASC;
`;
