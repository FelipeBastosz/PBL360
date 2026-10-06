import { AttendanceStatus } from '../enums/attendance-status.enum';

export interface EnrolledStudent {
  id: string;
  name: string;
}

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  seatNumber: number | null;
  justification: string | null;
}

export interface RecordedAttendance extends AttendanceEntry {
  recordedAt: Date;
}

export interface PreviousRollCall {
  sessionId: string;
  date: string;
  entries: AttendanceEntry[];
}

export enum RollCallOrigin {
  RECORDED = 'RECORDED',
  PREVIOUS_SESSION = 'PREVIOUS_SESSION',
  EMPTY = 'EMPTY',
}

export interface RollCallStudent {
  studentId: string;
  name: string;
  initials: string;
  seatNumber: number | null;
  status: AttendanceStatus | null;
  justification: string | null;
}

export interface RollCallTotals {
  present: number;
  late: number;
  excused: number;
  absent: number;
  unrecorded: number;
}

export interface RollCall {
  sessionId: string;
  origin: RollCallOrigin;
  referenceSession: { id: string; date: string } | null;
  recordedAt: Date | null;
  seats: number;
  students: RollCallStudent[];
  totals: RollCallTotals;
}

export const SEATED_STATUSES: readonly AttendanceStatus[] = [
  AttendanceStatus.PRESENT,
  AttendanceStatus.LATE,
];
