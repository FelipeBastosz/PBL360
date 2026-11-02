import type {
  ReceivedFeedback,
  ReceivedIndividualFeedback,
  ReceivedProblemFeedbacks,
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
): ReceivedFeedback {
  return {
    id: row.id,
    author: { id: row.authorId, name: row.authorName },
    text: row.text,
    createdAt: row.createdAt,
    editedAt: row.editedAt,
    isNew: newlyRead.has(row.id),
    score,
  };
}

export function toReceivedProblem(
  rows: ReceivedFeedbackRow[],
  sessions: ReceivedSessionRow[],
  newlyRead: Set<string>,
  grades: ReceivedFeedbackGrades,
): ReceivedProblemFeedbacks {
  const individual = rows.find((row) => row.scope === 'ALUNO');
  const general = rows.find((row) => row.scope === 'PROBLEMA');
  return {
    finalScore: grades.finalScore,
    individual: individual ? toIndividualFeedback(individual, newlyRead, grades.released) : null,
    general: general ? toReceivedFeedback(general, newlyRead, grades.finalScore) : null,
    sessions: sessions.map((session) => toSessionFeedback(session, rows, newlyRead, grades)),
  };
}

function toIndividualFeedback(
  row: ReceivedFeedbackRow,
  newlyRead: Set<string>,
  released: boolean,
): ReceivedIndividualFeedback {
  const score = released && row.score !== null ? Number(row.score) : null;
  return toReceivedFeedback(row, newlyRead, score);
}

function toSessionFeedback(
  session: ReceivedSessionRow,
  rows: ReceivedFeedbackRow[],
  newlyRead: Set<string>,
  grades: ReceivedFeedbackGrades,
) {
  const row = rows.find((item) => item.scope === 'SESSAO' && item.sessionId === session.sessionId);
  const score = grades.sessions.get(session.sessionId) ?? null;
  return { ...session, feedback: row ? toReceivedFeedback(row, newlyRead, score) : null };
}
