export const RECEIVED_FEEDBACK_REPOSITORY = Symbol('RECEIVED_FEEDBACK_REPOSITORY');

export interface ReceivedComponentGrade {
  nota: number | null;
  situacao: string;
  origem?: 'FORMULARIO' | 'PLANNING_POKER';
}

export interface ReceivedSessionComponents {
  modalidade: 'AUTOAVALIACAO' | 'PARES';
  autoavaliacao: ReceivedComponentGrade | null;
  pares: ReceivedComponentGrade | null;
}

export interface ReceivedFeedback {
  id: string | null;
  author: { id: string; name: string };
  text: string | null;
  createdAt: Date;
  editedAt: Date | null;
  isNew: boolean;
  score: number | null;
  components?: ReceivedSessionComponents;
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
    score?: number | null;
    components?: ReceivedSessionComponents;
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
