import type { Feedback } from '../../domain/entities/feedback.entity';
import type { FeedbackRevision } from '../../domain/entities/feedback-revision.entity';

export const FEEDBACK_COLUMNS = `
  id,
  autor_id AS "authorId",
  problema_id AS "problemId",
  destinatario_id AS "recipientId",
  sessao_id AS "sessionId",
  escopo AS "scope",
  nota AS "score",
  texto AS "text",
  criado_em AS "createdAt",
  editado_em AS "editedAt"
`;

export const FIND_FEEDBACK_BY_ID_QUERY = `
  SELECT ${FEEDBACK_COLUMNS}
  FROM feedback
  WHERE id = $1
  LIMIT 1;
`;

export const FIND_STUDENT_PROBLEM_FEEDBACK_QUERY = `
  SELECT ${FEEDBACK_COLUMNS}
  FROM feedback
  WHERE problema_id = $1
    AND destinatario_id = $2
    AND escopo = 'ALUNO'
  LIMIT 1;
`;

export const FIND_GENERAL_PROBLEM_FEEDBACK_QUERY = `
  SELECT ${FEEDBACK_COLUMNS}
  FROM feedback
  WHERE problema_id = $1
    AND escopo = 'PROBLEMA'
  LIMIT 1;
`;

export const FIND_STUDENT_SESSION_FEEDBACK_QUERY = `
  SELECT ${FEEDBACK_COLUMNS}
  FROM feedback
  WHERE sessao_id = $1
    AND destinatario_id = $2
    AND escopo = 'SESSAO'
  LIMIT 1;
`;

export const FIND_REVISIONS_QUERY = `
  SELECT
    r.conteudo_anterior_nota AS "score",
    r.conteudo_anterior_texto AS "text",
    COALESCE(u.name, r.edited_by::text) AS "editedBy",
    r.edited_at AS "editedAt"
  FROM feedback_revisions r
  LEFT JOIN users u ON u.id = r.edited_by
  WHERE r.feedback_id = $1
  ORDER BY r.edited_at DESC;
`;

export const CHECK_STUDENT_ENROLLED_QUERY = `
  SELECT 1
  FROM room_students
  WHERE room_id = $1
    AND student_id = $2
  LIMIT 1;
`;

export const LIST_STUDENTS_FEEDBACK_QUERY = `
  SELECT
    u.id AS "studentId",
    u.name AS "studentName",
    f.id AS "feedbackId",
    f.autor_id AS "authorId",
    f.problema_id AS "problemId",
    f.destinatario_id AS "recipientId",
    f.sessao_id AS "sessionId",
    f.escopo AS "scope",
    f.nota AS "score",
    f.texto AS "text",
    f.criado_em AS "createdAt",
    f.editado_em AS "editedAt"
  FROM room_students rs
  JOIN users u ON u.id = rs.student_id
  LEFT JOIN feedback f
    ON f.problema_id = $2
   AND f.destinatario_id = u.id
   AND f.escopo = 'ALUNO'
  WHERE rs.room_id = $1
  ORDER BY u.name ASC;
`;

export const INSERT_FEEDBACK_QUERY = `
  INSERT INTO feedback (
    id, autor_id, problema_id, destinatario_id, sessao_id, escopo, nota, texto, criado_em, editado_em
  ) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9
  ) RETURNING ${FEEDBACK_COLUMNS};
`;

export const INSERT_FEEDBACK_REVISION_QUERY = `
  INSERT INTO feedback_revisions (
    id, feedback_id, conteudo_anterior_nota, conteudo_anterior_texto, edited_by, edited_at
  ) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5
  );
`;

export const UPDATE_FEEDBACK_QUERY = `
  UPDATE feedback
  SET autor_id = $2, nota = $3, texto = $4, editado_em = $5
  WHERE id = $1;
`;

export const toFeedbackParams = (feedback: Feedback): unknown[] => [
  feedback.authorId,
  feedback.problemId,
  feedback.recipientId,
  feedback.sessionId,
  feedback.scope,
  feedback.score,
  feedback.text,
  feedback.createdAt,
  feedback.editedAt,
];

export const toRevisionParams = (revision: FeedbackRevision): unknown[] => [
  revision.feedbackId,
  revision.previousScore,
  revision.previousText,
  revision.editedBy,
  revision.editedAt,
];
