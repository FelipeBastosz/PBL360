import type { EvaluationStatus } from '@/evaluations/domain/enums/evaluation-status.enum';

export const SESSION_REPORT_REPOSITORY = Symbol('SESSION_REPORT_REPOSITORY');

export interface SessionReportStudentData {
  studentId: string;
  name: string;
  matricula: string | null;
  attendanceStatus: string | null;
  role: string | null;
  roleScore: number | null;
  tags: string[];
  evaluationStatus: EvaluationStatus | null;
  appliedBonus: number | null;
  items: Array<{ criterionId: string; score: number }>;
  recordedSessionScore: number | null;
  feedback: { text: string; authorName: string } | null;
}

export interface SessionReportData {
  room: {
    id: string;
    name: string;
    courseCode: string;
    semester: string;
  };
  problem: {
    id: string;
    title: string;
    orderIndex: number | null;
  };
  session: {
    id: string;
    title: string;
    orderIndex: number | null;
    date: string | Date;
  };
  criteria: Array<{
    id: string;
    name: string;
    weight: number;
  }>;
  formula: {
    criteriaWeight: number;
    roleWeight: number;
  };
  students: SessionReportStudentData[];
  generalFeedback: {
    text: string;
    authorName: string;
  } | null;
}

export interface SessionReportRepository {
  getSessionReportData(sessionId: string, roomId: string): Promise<SessionReportData>;
}
