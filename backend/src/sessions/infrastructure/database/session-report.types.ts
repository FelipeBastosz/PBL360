import type { EvaluationStatus } from '@/evaluations/domain/enums/evaluation-status.enum';
import type { AttendanceStatus } from '../../domain/enums/attendance-status.enum';
import type { SessionRole } from '../../domain/enums/session-role.enum';

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
  status: AttendanceStatus | string;
}

export interface RoleRow {
  studentId: string;
  role: SessionRole | string;
  roleScore: string | number | null;
}

export interface ObservationTagsRow {
  studentId: string;
  tags: string[];
}

export interface EvaluationRow {
  id: string;
  studentId: string;
  status: EvaluationStatus;
  appliedBonus: string | number | null;
}

export interface FeedbackRow {
  id: string;
  recipientId: string | null;
  text: string;
  authorName: string;
}

import type { EvaluationSummary } from '@/evaluations/domain/repositories/evaluation.repository';

export interface SessionReportRawData {
  header: HeaderRow | undefined;
  roomId: string;
  sessionId: string;
  students: StudentRow[];
  attendances: AttendanceRow[];
  roles: RoleRow[];
  observations: ObservationTagsRow[];
  evaluations: EvaluationRow[];
  feedbacks: FeedbackRow[];
  summaries?: EvaluationSummary[];
}
