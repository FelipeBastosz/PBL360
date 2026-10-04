import {
  ConflictError,
  InvalidRequestError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import type { AttendanceEntry, EnrolledStudent } from '../../domain/roll-call/roll-call';

const findDuplicate = <T>(values: T[]): T | undefined =>
  values.find((value, index) => values.indexOf(value) !== index);

function assertEachStudentOnce(entries: AttendanceEntry[]): void {
  if (findDuplicate(entries.map((entry) => entry.studentId)) !== undefined) {
    throw new InvalidRequestError('Cada aluno deve aparecer uma única vez na chamada.');
  }
}

function assertStudentsEnrolled(entries: AttendanceEntry[], enrolled: EnrolledStudent[]): void {
  const enrolledIds = new Set(enrolled.map((student) => student.id));
  if (entries.some((entry) => !enrolledIds.has(entry.studentId))) {
    throw new UnprocessableEntityError('O aluno informado não está matriculado na sala.');
  }
}

function assertSeatsExist(entries: AttendanceEntry[], seats: number): void {
  const outside = entries.find((entry) => entry.seatNumber !== null && entry.seatNumber > seats);
  if (outside) {
    throw new UnprocessableEntityError(
      `O lugar ${outside.seatNumber} não existe na mesa, que tem ${seats} lugares.`,
    );
  }
}

function assertSeatsUnique(entries: AttendanceEntry[]): void {
  const seats = entries
    .map((entry) => entry.seatNumber)
    .filter((seat): seat is number => seat !== null);
  const repeated = findDuplicate(seats);
  if (repeated !== undefined) {
    throw new ConflictError('Dois alunos não podem ocupar o mesmo lugar na mesa.', {
      lugar: repeated,
    });
  }
}

export function assertBatchFitsRoom(entries: AttendanceEntry[], enrolled: EnrolledStudent[]): void {
  assertEachStudentOnce(entries);
  assertStudentsEnrolled(entries, enrolled);
  assertSeatsExist(entries, enrolled.length);
  assertSeatsUnique(entries);
}
