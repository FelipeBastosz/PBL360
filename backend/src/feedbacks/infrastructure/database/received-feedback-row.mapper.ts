import type {
  ReceivedFeedback,
  ReceivedProblemFeedbacks,
  ReceivedSessionComponents,
} from '../../domain/repositories/received-feedback.repository';
import type { ReceivedFeedbackGrades } from './received-feedback-grades.reads';

export interface ReceivedFeedbackRow {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Date;
  editedAt: Date | null;
  scope: 'ALUNO' | 'PROBLEMA' | 'SESSAO';
  sessionId: string | null;
  problemId: string;
  roomId: string;
  score: string | number | null;
}

export interface ReceivedSessionRow {
  sessionId: string;
  label: string;
  date: string;
}

export function toReceivedFeedback(
  row: ReceivedFeedbackRow,
  newlyRead: Set<string>,
  score: number | null,
  components?: ReceivedSessionComponents,
): ReceivedFeedback {
  return {
    id: row.id,
    author: { id: row.authorId, name: row.authorName },
    text: row.text,
    createdAt: row.createdAt,
    editedAt: row.editedAt,
    isNew: newlyRead.has(row.id),
    score,
    ...(components ? { components } : {}),
  };
}

export function toReceivedProblem(
  rows: ReceivedFeedbackRow[],
  sessions: ReceivedSessionRow[],
  newlyRead: Set<string>,
  grades: ReceivedFeedbackGrades,
): ReceivedProblemFeedbacks {
  const general = rows.find((row) => row.scope === 'PROBLEMA');
  return {
    finalScore: grades.finalScore,
    general: general ? toReceivedFeedback(general, newlyRead, grades.finalScore) : null,
    sessions: sessions.map((session) => toSessionFeedback(session, rows, newlyRead, grades)),
  };
}

function toSessionFeedback(
  session: ReceivedSessionRow,
  rows: ReceivedFeedbackRow[],
  newlyRead: Set<string>,
  grades: ReceivedFeedbackGrades,
) {
  const row = rows.find((item) => item.scope === 'SESSAO' && item.sessionId === session.sessionId);
  const score = grades.sessions.get(session.sessionId) ?? null;
  const components = grades.components?.get(session.sessionId);
  return {
    ...session,
    feedback: row ? toReceivedFeedback(row, newlyRead, score, components) : null,
    ...(components ? { score, components } : {}),
  };
}
