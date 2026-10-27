import { Feedback } from '../../domain/entities/feedback.entity';
import type { FeedbackScope } from '../../domain/enums/feedback-scope.enum';
import type { ProblemFeedbackDetail } from '../../domain/repositories/feedback.repository';

export interface FeedbackRow {
  id: string;
  authorId: string;
  problemId: string;
  recipientId: string | null;
  sessionId: string | null;
  scope: FeedbackScope;
  score: string | number | null;
  text: string;
  createdAt: Date;
  editedAt: Date | null;
}

export interface StudentFeedbackRow extends FeedbackRow {
  studentId: string;
  studentName: string;
  feedbackId: string | null;
}

export interface ProblemFeedbackDetailRow {
  id: string;
  scope: FeedbackScope;
  authorId: string;
  authorName: string;
  recipientId: string | null;
  recipientName: string | null;
  sessionId: string | null;
  sessionTitle: string | null;
  score: string | number | null;
  text: string;
  createdAt: Date;
  editedAt: Date | null;
}

export const toFeedbackEntity = (row: FeedbackRow): Feedback => {
  const entity = new Feedback();
  entity.id = row.id;
  entity.authorId = row.authorId;
  entity.problemId = row.problemId;
  entity.recipientId = row.recipientId;
  entity.sessionId = row.sessionId;
  entity.scope = row.scope;
  entity.score = row.score !== null ? Number(row.score) : null;
  entity.text = row.text;
  entity.createdAt = row.createdAt;
  entity.editedAt = row.editedAt;
  return entity;
};

export const toProblemFeedbackDetail = (row: ProblemFeedbackDetailRow): ProblemFeedbackDetail => ({
  id: row.id,
  scope: row.scope,
  authorId: row.authorId,
  authorName: row.authorName,
  recipientId: row.recipientId,
  recipientName: row.recipientName,
  sessionId: row.sessionId,
  sessionTitle: row.sessionTitle,
  score: row.score !== null ? Number(row.score) : null,
  text: row.text,
  createdAt: row.createdAt,
  editedAt: row.editedAt,
});
