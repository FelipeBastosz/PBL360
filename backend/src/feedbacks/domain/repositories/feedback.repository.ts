import type { Feedback } from '../entities/feedback.entity';
import type { FeedbackRevision } from '../entities/feedback-revision.entity';
import type { FeedbackScope } from '../enums/feedback-scope.enum';

export const FEEDBACK_REPOSITORY = Symbol('FEEDBACK_REPOSITORY');

export interface FeedbackWithStudent {
  studentId: string;
  studentName: string;
  feedback: Feedback | null;
}

export interface FeedbackRevisionItem {
  score: number | null;
  text: string;
  editedBy: string;
  editedAt: Date;
}

export interface ProblemFeedbackDetail {
  id: string;
  scope: FeedbackScope;
  authorId: string;
  authorName: string;
  recipientId: string | null;
  recipientName: string | null;
  sessionId: string | null;
  sessionTitle: string | null;
  score: number | null;
  text: string;
  createdAt: Date;
  editedAt: Date | null;
}

export interface FeedbackRepository {
  findById(id: string): Promise<Feedback | null>;
  findStudentProblemFeedback(problemId: string, studentId: string): Promise<Feedback | null>;
  findGeneralProblemFeedback(problemId: string): Promise<Feedback | null>;
  findStudentSessionFeedback(sessionId: string, studentId: string): Promise<Feedback | null>;
  findStudentSessionFeedbackReadAt(feedbackId: string, studentId: string): Promise<Date | null>;
  markStudentSessionFeedbackRead(
    feedbackId: string,
    studentId: string,
    readAt: Date,
  ): Promise<void>;
  saveWithRevision(feedback: Feedback, revision: FeedbackRevision | null): Promise<Feedback>;
  findRevisionsByFeedbackId(feedbackId: string): Promise<FeedbackRevisionItem[]>;
  isStudentEnrolledInRoom(roomId: string, studentId: string): Promise<boolean>;
  listStudentsWithProblemFeedbacks(
    roomId: string,
    problemId: string,
  ): Promise<FeedbackWithStudent[]>;
  findProblemFeedbacksWithDetails(problemId: string): Promise<ProblemFeedbackDetail[]>;
}
