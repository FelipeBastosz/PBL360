export const RECEIVED_FEEDBACK_REPOSITORY = Symbol('RECEIVED_FEEDBACK_REPOSITORY');

export interface ReceivedFeedback {
  id: string;
  author: { id: string; name: string };
  text: string;
  createdAt: Date;
  editedAt: Date | null;
  isNew: boolean;
  score: number | null;
}

export type ReceivedIndividualFeedback = ReceivedFeedback;

export interface ReceivedProblemFeedbacks {
  finalScore: number | null;
  individual: ReceivedIndividualFeedback | null;
  general: ReceivedFeedback | null;
  sessions: {
    sessionId: string;
    label: string;
    date: string;
    feedback: ReceivedFeedback | null;
  }[];
}

export interface ReceivedFeedbackRepository {
  readSession(sessionId: string, studentId: string): Promise<ReceivedFeedback | null>;
  readProblem(
    problemId: string,
    studentId: string,
    roomId: string,
  ): Promise<ReceivedProblemFeedbacks>;
}
