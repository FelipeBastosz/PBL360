import { AttendanceStatus } from '../enums/attendance-status.enum';
import { InvalidAttendanceError } from '../errors/invalid-attendance.error';
import { createAttendanceEntry } from './attendance-entry';

const entry = (overrides: Partial<Parameters<typeof createAttendanceEntry>[0]> = {}) => ({
  studentId: 'ana',
  status: AttendanceStatus.PRESENT,
  seatNumber: null,
  justification: null,
  ...overrides,
});

describe('createAttendanceEntry', () => {
  it.each([AttendanceStatus.PRESENT, AttendanceStatus.LATE])(
    'lets a %s student take a seat',
    (status) => {
      expect(createAttendanceEntry(entry({ status, seatNumber: 3 })).seatNumber).toBe(3);
    },
  );

  it.each([AttendanceStatus.EXCUSED, AttendanceStatus.ABSENT])(
    'keeps an %s student off the table',
    (status) => {
      expect(() => createAttendanceEntry(entry({ status, seatNumber: 1 }))).toThrow(
        new InvalidAttendanceError(
          'Só alunos presentes ou atrasados podem ocupar um lugar na mesa.',
        ),
      );
    },
  );

  it('accepts a justification only on an excused absence', () => {
    expect(
      createAttendanceEntry(
        entry({ status: AttendanceStatus.EXCUSED, justification: ' Atestado ' }),
      ).justification,
    ).toBe('Atestado');
    expect(() =>
      createAttendanceEntry(entry({ status: AttendanceStatus.ABSENT, justification: 'Atestado' })),
    ).toThrow('A justificativa só pode ser informada em faltas justificadas.');
  });

  it('treats a blank justification as none', () => {
    expect(
      createAttendanceEntry(entry({ status: AttendanceStatus.PRESENT, justification: '   ' }))
        .justification,
    ).toBeNull();
  });

  it('rejects a justification longer than 500 characters', () => {
    const justification = 'a'.repeat(501);

    expect(() =>
      createAttendanceEntry(entry({ status: AttendanceStatus.EXCUSED, justification })),
    ).toThrow('A justificativa deve ter no máximo 500 caracteres.');
  });

  it('rejects a seat that is not a positive integer', () => {
    expect(() => createAttendanceEntry(entry({ seatNumber: 0 }))).toThrow(InvalidAttendanceError);
    expect(() => createAttendanceEntry(entry({ seatNumber: 1.5 }))).toThrow(InvalidAttendanceError);
  });
});
