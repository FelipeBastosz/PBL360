import { AttendanceStatus } from '../enums/attendance-status.enum';
import { InvalidAttendanceError } from '../errors/invalid-attendance.error';
import { SEATED_STATUSES, type AttendanceEntry } from './roll-call';

export const MAX_JUSTIFICATION_LENGTH = 500;

export function createAttendanceEntry(input: AttendanceEntry): AttendanceEntry {
  const justification = input.justification?.trim() || null;

  if (input.seatNumber !== null && !SEATED_STATUSES.includes(input.status)) {
    throw new InvalidAttendanceError(
      'Só alunos presentes ou atrasados podem ocupar um lugar na mesa.',
    );
  }

  if (input.seatNumber !== null && (!Number.isInteger(input.seatNumber) || input.seatNumber < 1)) {
    throw new InvalidAttendanceError('O lugar na mesa deve ser um número inteiro a partir de 1.');
  }

  if (justification !== null && input.status !== AttendanceStatus.EXCUSED) {
    throw new InvalidAttendanceError(
      'A justificativa só pode ser informada em faltas justificadas.',
    );
  }

  if (justification !== null && justification.length > MAX_JUSTIFICATION_LENGTH) {
    throw new InvalidAttendanceError('A justificativa deve ter no máximo 500 caracteres.');
  }

  return { ...input, justification };
}
