import { AttendanceStatus } from '../enums/attendance-status.enum';
import {
  RollCallOrigin,
  type AttendanceEntry,
  type EnrolledStudent,
  type PreviousRollCall,
  type RecordedAttendance,
  type RollCall,
  type RollCallStudent,
  type RollCallTotals,
} from './roll-call';

export interface BuildRollCallInput {
  sessionId: string;
  enrolled: EnrolledStudent[];
  recorded: RecordedAttendance[];
  previous: PreviousRollCall | null;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1] ?? '') : '';
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function toStudent(student: EnrolledStudent, entry: AttendanceEntry | undefined): RollCallStudent {
  return {
    studentId: student.id,
    name: student.name,
    initials: initialsOf(student.name),
    seatNumber: entry?.seatNumber ?? null,
    status: entry?.status ?? null,
    justification: entry?.justification ?? null,
  };
}

function suggestFromPrevious(previous: PreviousRollCall, seats: number): AttendanceEntry[] {
  return previous.entries
    .filter((entry) => entry.seatNumber !== null && entry.seatNumber <= seats)
    .map((entry) => ({
      studentId: entry.studentId,
      status: AttendanceStatus.PRESENT,
      seatNumber: entry.seatNumber,
      justification: null,
    }));
}

function countTotals(students: RollCallStudent[]): RollCallTotals {
  const count = (status: AttendanceStatus | null) =>
    students.filter((student) => student.status === status).length;

  return {
    present: count(AttendanceStatus.PRESENT),
    late: count(AttendanceStatus.LATE),
    excused: count(AttendanceStatus.EXCUSED),
    absent: count(AttendanceStatus.ABSENT),
    unrecorded: count(null),
  };
}

function latestRecordedAt(recorded: RecordedAttendance[]): Date | null {
  return recorded.reduce<Date | null>(
    (latest, entry) => (!latest || entry.recordedAt > latest ? entry.recordedAt : latest),
    null,
  );
}

function pickEntries(input: BuildRollCallInput, seats: number) {
  if (input.recorded.length) {
    return { origin: RollCallOrigin.RECORDED, entries: input.recorded, reference: null };
  }
  if (input.previous) {
    const { sessionId, date } = input.previous;
    return {
      origin: RollCallOrigin.PREVIOUS_SESSION,
      entries: suggestFromPrevious(input.previous, seats),
      reference: { id: sessionId, date },
    };
  }
  return { origin: RollCallOrigin.EMPTY, entries: [], reference: null };
}

export function buildRollCall(input: BuildRollCallInput): RollCall {
  const seats = input.enrolled.length;
  const { origin, entries, reference } = pickEntries(input, seats);
  const byStudent = new Map(entries.map((entry) => [entry.studentId, entry]));
  const students = [...input.enrolled]
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((student) => toStudent(student, byStudent.get(student.id)));

  return {
    sessionId: input.sessionId,
    origin,
    referenceSession: reference,
    recordedAt: origin === RollCallOrigin.RECORDED ? latestRecordedAt(input.recorded) : null,
    seats,
    students,
    totals: countTotals(students),
  };
}
