export interface StudentRow {
  alunoId: string;
  nome: string;
  matricula: string | null;
}

export interface SelfEvaluationRow {
  id: string;
  studentId: string;
  status: string;
  submittedAt: Date | null;
  sessionScore: string | number | null;
}

export interface SelfAdjustmentRow {
  evaluationId: string;
  newValue: string | number;
}

export interface SelfAdjustmentDetailRow {
  previousValue: string | number;
  newValue: string | number;
  justification: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
}

export interface ComparisonPeerRow {
  id: string;
  avaliadorId: string;
  avaliadorNome: string;
  enviadaEm: Date;
  notaConsolidada: string | number;
}

export interface ComparisonPeerItemRow {
  criterionId: string;
  score: string | number;
}

export interface EvaluationItemRow {
  evaluationId: string;
  criterionId: string;
  score: string | number;
}

export interface TutorScoreRow {
  studentId: string;
  criterionId: string;
  score: string | number;
  bonusScore?: string | number | null;
}

export interface SessionTimingRow {
  selfEvalReleased: boolean;
  selfEvalDeadline: Date | null;
  peerEvalReleased?: boolean;
  peerEvalDeadline?: Date | null;
}

export interface PokerRoundHistoryRow {
  id: string;
  studentId: string;
  roundNumber: number;
  average: string | number | null;
  finalGrade: string | number;
  adjusted: boolean;
  justification: string | null;
  decidedAt: Date;
  decidedById: string | null;
  decidedByName: string | null;
  anonymous: boolean;
  currentGrade: string | number | null;
  adjustmentCount: number;
  voteCount: number;
}

export interface PokerVoteRow {
  voterId: string | null;
  voterName: string | null;
  score: string | number;
}
