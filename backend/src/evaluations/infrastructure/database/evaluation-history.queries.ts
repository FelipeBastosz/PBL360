export const IS_STUDENT_PARTICIPATING_QUERY = `
  SELECT EXISTS (
    SELECT 1 FROM attendances
     WHERE session_id = $1 AND student_id = $2 AND status IN ('PRESENT', 'LATE')
  ) AS exists;
`;

export const FIND_PARTICIPATING_STUDENTS_QUERY = `
  SELECT u.id AS "alunoId", u.name AS "nome", u.registration_number AS "matricula"
    FROM attendances a
    JOIN users u ON u.id = a.student_id
   WHERE a.session_id = $1 AND a.status IN ('PRESENT', 'LATE')
   ORDER BY u.name, u.id;
`;

export const FIND_SESSION_SELF_EVALUATIONS_QUERY = `
  SELECT id, student_id AS "studentId", status, session_score AS "sessionScore"
    FROM evaluations
   WHERE session_id = $1 AND type = 'SELF_ASSESSMENT';
`;

export const FIND_SESSION_ADJUSTMENTS_QUERY = `
  SELECT ga.evaluation_id AS "evaluationId", ga.new_value AS "newValue"
    FROM grade_adjustments ga
    JOIN evaluations e ON e.id = ga.evaluation_id
   WHERE e.session_id = $1 AND e.type = 'SELF_ASSESSMENT'
   ORDER BY ga.created_at DESC, ga.id DESC;
`;

export const FIND_SESSION_PEER_EVALUATIONS_QUERY = `
  SELECT e.student_id AS "studentId", e.session_score AS "sessionScore"
    FROM evaluations e
   WHERE e.session_id = $1 AND e.type = 'PEER_ASSESSMENT' AND e.status = 'SUBMITTED'
     AND e.evaluator_id <> e.student_id;
`;

export const FIND_SESSION_TUTOR_SCORES_QUERY = `
  SELECT e.student_id AS "studentId", ei.criterion_id AS "criterionId", ei.score
    FROM evaluations e
    JOIN evaluation_items ei ON ei.evaluation_id = e.id
   WHERE e.session_id = $1 AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
  UNION ALL
  SELECT cg.student_id AS "studentId", cg.criterion_id AS "criterionId", cg.score
    FROM criterion_grades cg
   WHERE cg.session_id = $1
     AND NOT EXISTS (
       SELECT 1 FROM evaluations e
        WHERE e.session_id = cg.session_id AND e.student_id = cg.student_id
          AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
     );
`;

export const FIND_STUDENT_PARTICIPANT_QUERY = `
  SELECT u.id AS "alunoId", u.name AS "nome", u.registration_number AS "matricula"
    FROM attendances a
    JOIN users u ON u.id = a.student_id
   WHERE a.session_id = $1 AND a.student_id = $2 AND a.status IN ('PRESENT', 'LATE');
`;

export const FIND_SESSION_TIMINGS_QUERY = `
  SELECT self_eval_released AS "selfEvalReleased", self_eval_deadline AS "selfEvalDeadline"
    FROM sessions WHERE id = $1;
`;

export const FIND_STUDENT_SELF_EVALUATION_QUERY = `
  SELECT id, student_id AS "studentId", status, submitted_at AS "submittedAt",
         session_score AS "sessionScore"
    FROM evaluations
   WHERE session_id = $1 AND student_id = $2 AND type = 'SELF_ASSESSMENT';
`;

export const FIND_EVALUATION_ITEMS_QUERY = `
  SELECT criterion_id AS "criterionId", score
    FROM evaluation_items WHERE evaluation_id = $1;
`;

export const FIND_SELF_ADJUSTMENTS_DETAIL_QUERY = `
  SELECT ga.previous_value AS "previousValue", ga.new_value AS "newValue",
         ga.justification, ga.created_by AS "authorId", u.name AS "authorName",
         ga.created_at AS "createdAt"
    FROM grade_adjustments ga
    JOIN users u ON u.id = ga.created_by
   WHERE ga.evaluation_id = $1
   ORDER BY ga.created_at DESC, ga.id DESC;
`;

export const FIND_STUDENT_TUTOR_SCORES_QUERY = `
  SELECT ei.criterion_id AS "criterionId", ei.score
    FROM evaluations e
    JOIN evaluation_items ei ON ei.evaluation_id = e.id
   WHERE e.session_id = $1 AND e.student_id = $2 AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
  UNION ALL
  SELECT cg.criterion_id AS "criterionId", cg.score
    FROM criterion_grades cg
   WHERE cg.session_id = $1 AND cg.student_id = $2
     AND NOT EXISTS (
       SELECT 1 FROM evaluations e
        WHERE e.session_id = $1 AND e.student_id = $2
          AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
     );
`;

export const FIND_RECEIVED_PEER_EVALUATIONS_QUERY = `
  SELECT e.id, e.evaluator_id AS "avaliadorId", u.name AS "avaliadorNome",
         e.submitted_at AS "enviadaEm", e.session_score AS "notaConsolidada"
    FROM evaluations e
    JOIN users u ON u.id = e.evaluator_id
   WHERE e.session_id = $1 AND e.student_id = $2
     AND e.type = 'PEER_ASSESSMENT' AND e.status = 'SUBMITTED'
     AND e.evaluator_id <> e.student_id
   ORDER BY e.submitted_at ASC, e.id ASC;
`;

export const FIND_PEERS_ITEMS_QUERY = `
  SELECT evaluation_id AS "evaluationId", criterion_id AS "criterionId", score
    FROM evaluation_items
   WHERE evaluation_id = ANY($1)
   ORDER BY criterion_id;
`;
