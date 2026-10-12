export const PERFORMANCE_TABLE_SUMMARY_QUERY = `
  SELECT performance_tables.id,
         performance_tables.tutor_id AS "tutorId",
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
   WHERE performance_tables.tutor_id = $1
     AND performance_tables.deleted_at IS NULL
   GROUP BY performance_tables.id
   ORDER BY performance_tables.created_at ASC,
            performance_tables.id ASC;
`;

export const FIND_PERFORMANCE_TABLE_BY_ID_QUERY = `
  SELECT pt.id,
         pt.tutor_id AS "tutorId",
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
    name,
    description,
    is_default
  )
  VALUES ($1, $2, $3, $4)
  RETURNING
    id,
    tutor_id AS "tutorId",
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
         COUNT(*) FILTER (WHERE date < CURRENT_DATE)::int AS "pastSessionCount"
    FROM table_sessions;
`;

export const FIND_PERFORMANCE_TABLE_BY_ID_INCLUDING_DELETED_QUERY = `
  SELECT pt.id,
         pt.tutor_id AS "tutorId",
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
