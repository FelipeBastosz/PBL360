import type {
  AttendanceEntry,
  EnrolledStudent,
  PreviousRollCall,
  RecordedAttendance,
} from '../roll-call/roll-call';

export const ATTENDANCE_REPOSITORY = Symbol('ATTENDANCE_REPOSITORY');

export interface SessionReference {
  id: string;
  date: string;
}

export interface AttendanceRepository {
  findEnrolledStudents(roomId: string): Promise<EnrolledStudent[]>;
  findBySession(sessionId: string): Promise<RecordedAttendance[]>;
  findPreviousRollCall(roomId: string, session: SessionReference): Promise<PreviousRollCall | null>;
  saveBatch(sessionId: string, recordedBy: string, entries: AttendanceEntry[]): Promise<void>;
}
