export const RECEIVED_FEEDBACK_REPOSITORY = Symbol('RECEIVED_FEEDBACK_REPOSITORY');

export interface ReceivedFeedback {
  id: string;
  author: { id: string; name: string };
  text: string;
  createdAt: Date;
  editedAt: Date | null;
  isNew: boolean;
}

export interface ReceivedIndividualFeedback extends ReceivedFeedback {
  score: number | null;
}

export interface ReceivedProblemFeedbacks {
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
  readProblem(problemId: string, studentId: string): Promise<ReceivedProblemFeedbacks>;
}
