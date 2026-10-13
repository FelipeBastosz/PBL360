import type {
  ReceivedFeedback,
  ReceivedIndividualFeedback,
  ReceivedProblemFeedbacks,
} from '../../domain/repositories/received-feedback.repository';

export interface ReceivedFeedbackRow {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Date;
  editedAt: Date | null;
  scope: 'ALUNO' | 'PROBLEMA' | 'SESSAO';
  sessionId: string | null;
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
): ReceivedFeedback {
  return {
    id: row.id,
    author: { id: row.authorId, name: row.authorName },
    text: row.text,
    createdAt: row.createdAt,
    editedAt: row.editedAt,
    isNew: newlyRead.has(row.id),
  };
}

export function toReceivedProblem(
  rows: ReceivedFeedbackRow[],
  sessions: ReceivedSessionRow[],
  newlyRead: Set<string>,
): ReceivedProblemFeedbacks {
  const individual = rows.find((row) => row.scope === 'ALUNO');
  const general = rows.find((row) => row.scope === 'PROBLEMA');
  return {
    individual: individual ? toIndividualFeedback(individual, newlyRead) : null,
    general: general ? toReceivedFeedback(general, newlyRead) : null,
    sessions: sessions.map((session) => toSessionFeedback(session, rows, newlyRead)),
  };
}

function toIndividualFeedback(
  row: ReceivedFeedbackRow,
  newlyRead: Set<string>,
): ReceivedIndividualFeedback {
  return {
    ...toReceivedFeedback(row, newlyRead),
    score: row.score === null ? null : Number(row.score),
  };
}

function toSessionFeedback(
  session: ReceivedSessionRow,
  rows: ReceivedFeedbackRow[],
  newlyRead: Set<string>,
) {
  const row = rows.find((item) => item.scope === 'SESSAO' && item.sessionId === session.sessionId);
  return { ...session, feedback: row ? toReceivedFeedback(row, newlyRead) : null };
}
