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
}

export interface SessionTimingRow {
  selfEvalReleased: boolean;
  selfEvalDeadline: Date | null;
}
