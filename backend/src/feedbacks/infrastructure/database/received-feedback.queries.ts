const COLUMNS = `f.id, f.autor_id AS "authorId", u.name AS "authorName",
  f.texto AS text, f.criado_em AS "createdAt", f.editado_em AS "editedAt",
  f.escopo AS scope, f.sessao_id AS "sessionId", f.nota AS score`;

const SUBMITTED = `EXISTS (
  SELECT 1 FROM evaluations e
  WHERE e.session_id = f.sessao_id AND e.problem_id = f.problema_id
    AND e.student_id = $2 AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
)`;

export const READ_SESSION_FEEDBACK = `
  SELECT ${COLUMNS} FROM feedback f JOIN users u ON u.id = f.autor_id
  WHERE f.sessao_id = $1 AND f.destinatario_id = $2 AND f.escopo = 'SESSAO'
    AND ${SUBMITTED}
  ORDER BY f.criado_em DESC, f.id LIMIT 1;
`;

export const READ_PROBLEM_FEEDBACKS = `
  SELECT ${COLUMNS} FROM feedback f JOIN users u ON u.id = f.autor_id
  WHERE f.problema_id = $1 AND (
    (f.escopo = 'PROBLEMA' AND f.destinatario_id IS NULL)
    OR (f.destinatario_id = $2 AND f.escopo = 'ALUNO')
    OR (f.destinatario_id = $2 AND f.escopo = 'SESSAO' AND ${SUBMITTED})
  ) ORDER BY f.criado_em DESC, f.id;
`;

export const READ_PROBLEM_SESSIONS = `
  SELECT id AS "sessionId", title AS label, date::text AS date FROM sessions
  WHERE problem_id = $1 ORDER BY date ASC, order_index ASC, id ASC;
`;

// RETURNING identifies the request that first read each feedback, even under concurrency.
export const INSERT_FIRST_VIEWS = `
  INSERT INTO feedback_views (feedback_id, student_id)
  SELECT id, $2::uuid FROM unnest($1::uuid[]) AS ids(id) ORDER BY id
  ON CONFLICT (feedback_id, student_id) DO NOTHING
  RETURNING feedback_id AS id;
`;
