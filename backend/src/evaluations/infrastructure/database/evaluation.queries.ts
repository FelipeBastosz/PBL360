export const FIND_EVALUATION = `
  SELECT id, status, submitted_at AS "submittedAt", session_score AS "sessionScore",
         applied_bonus AS "appliedBonus", calculation_version AS "calculationVersion",
         created_by AS "createdBy", created_at AS "createdAt",
         updated_by AS "updatedBy", updated_at AS "updatedAt"
    FROM evaluations WHERE session_id = $1 AND student_id = $2 AND type = 'TUTOR_SESSION';
`;
export const FIND_ITEMS = `
  SELECT id, criterion_id AS "criterionId", score FROM evaluation_items
   WHERE evaluation_id = $1 ORDER BY criterion_id;
`;
export const FIND_SELF_EVALUATION = `
  SELECT id, status, submitted_at AS "submittedAt", session_score AS "sessionScore",
         applied_bonus AS "appliedBonus", calculation_version AS "calculationVersion",
         created_by AS "createdBy", created_at AS "createdAt",
         updated_by AS "updatedBy", updated_at AS "updatedAt"
    FROM evaluations WHERE session_id = $1 AND student_id = $2 AND type = 'SELF_ASSESSMENT';
`;
export const FIND_ADJUSTMENTS = `
  SELECT ei.criterion_id AS "criterionId", ga.previous_value AS "previousValue",
         ga.new_value AS "newValue", ga.justification, ga.created_by AS "authorId",
         u.name AS "authorName", ga.created_at AS "createdAt"
    FROM grade_adjustments ga JOIN evaluation_items ei ON ei.id = ga.evaluation_item_id
    JOIN users u ON u.id = ga.created_by
   WHERE ei.evaluation_id = $1 ORDER BY ga.created_at, ga.id;
`;
export const LIST_EVALUATIONS = `
  SELECT u.id AS "studentId", u.name, e.status, e.id AS "evaluationId", e.applied_bonus AS "appliedBonus"
    FROM room_students rs JOIN users u ON u.id = rs.student_id
    LEFT JOIN evaluations e ON e.student_id = u.id AND e.session_id = $2 AND e.type = 'TUTOR_SESSION'
   WHERE rs.room_id = $1 ORDER BY u.name, u.id;
`;
export const UPDATE_EVALUATION = `
  UPDATE evaluations SET status = $2, submitted_at = $3, session_score = $4,
    applied_bonus = $5, calculation_version = $6, updated_by = $7, updated_at = $8 WHERE id = $1;
`;
