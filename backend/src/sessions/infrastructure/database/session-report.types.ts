import type { EvaluationStatus } from '@/evaluations/domain/enums/evaluation-status.enum';

export interface HeaderRow {
  sessionId: string;
  sessionTitle: string;
  sessionOrderIndex: number | null;
  sessionDate: string | Date;
  problemId: string;
  problemTitle: string;
  problemOrderIndex: number | null;
  roomId: string;
  roomName: string;
  courseCode: string;
  semester: string;
}

export interface StudentRow {
  studentId: string;
  name: string;
  matricula: string | null;
}

export interface AttendanceRow {
  studentId: string;
  status: string;
}

export interface RoleRow {
  studentId: string;
  role: string;
  roleScore: string | number | null;
}

export interface ObservationTagsRow {
  studentId: string;
  tags: string[];
}

export interface CriterionRow {
  id: string;
  name: string;
  weight: string | number;
}

export interface FormulaComponentRow {
  type: string;
  weight: string | number;
}

export interface EvaluationRow {
  id: string;
  studentId: string;
  status: EvaluationStatus;
  sessionScore: string | number | null;
  appliedBonus: string | number | null;
}

export interface EvaluationItemRow {
  evaluationId: string;
  criterionId: string;
  score: string | number;
}

export interface FeedbackRow {
  id: string;
  recipientId: string | null;
  text: string;
  authorName: string;
}

export interface SessionReportRawData {
  header: HeaderRow | undefined;
  roomId: string;
  sessionId: string;
  students: StudentRow[];
  attendances: AttendanceRow[];
  roles: RoleRow[];
  observations: ObservationTagsRow[];
  criteria: CriterionRow[];
  formulas: FormulaComponentRow[];
  evaluations: EvaluationRow[];
  items: EvaluationItemRow[];
  feedbacks: FeedbackRow[];
}
