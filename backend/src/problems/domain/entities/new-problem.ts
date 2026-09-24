export interface NewProblem {
  roomId: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  createdBy: string;
  startDate?: Date | null;
  endDate?: Date | null;
  selfEvalReleased?: boolean;
  peerEvalReleased?: boolean;
  releasedAt?: Date | null;
  selfEvalDeadline?: Date | null;
}
