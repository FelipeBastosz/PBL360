export interface NewProblem {
  roomId: string;
  title: string;
  description?: string | null;
  orderIndex?: number;
  createdBy: string;
  startDate?: string | null;
  endDate?: string | null;
  selfEvalReleased?: boolean;
  peerEvalReleased?: boolean;
  releasedAt?: Date | null;
  selfEvalDeadline?: Date | null;
}
