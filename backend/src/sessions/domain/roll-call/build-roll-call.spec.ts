import { AttendanceStatus } from '../enums/attendance-status.enum';
import { buildRollCall, initialsOf } from './build-roll-call';
import { RollCallOrigin, type EnrolledStudent, type PreviousRollCall } from './roll-call';

const ana: EnrolledStudent = { id: 'ana', name: 'Ana Souza' };
const bruno: EnrolledStudent = { id: 'bruno', name: 'Bruno Lima' };
const carla: EnrolledStudent = { id: 'carla', name: 'Carla Dias' };

const previous = (entries: PreviousRollCall['entries']): PreviousRollCall => ({
  sessionId: 'session-0',
  date: '2026-10-01',
  entries,
});

const seated = (studentId: string, seatNumber: number) => ({
  studentId,
  status: AttendanceStatus.PRESENT,
  seatNumber,
  justification: null,
});

describe('buildRollCall', () => {
  it('starts empty on the first session of the room', () => {
    const rollCall = buildRollCall({
      sessionId: 'session-1',
      enrolled: [ana, bruno],
      recorded: [],
      previous: null,
    });

    expect(rollCall).toMatchObject({
      origin: RollCallOrigin.EMPTY,
      referenceSession: null,
      recordedAt: null,
      seats: 2,
      totals: { present: 0, late: 0, excused: 0, absent: 0, unrecorded: 2 },
    });
    expect(rollCall.students.every((s) => s.seatNumber === null && s.status === null)).toBe(true);
  });

  it('seats again whoever sat at the table in the previous session, suggested as present', () => {
    const rollCall = buildRollCall({
      sessionId: 'session-1',
      enrolled: [ana, bruno],
      recorded: [],
      previous: previous([
        { ...seated('ana', 2), status: AttendanceStatus.LATE },
        seated('bruno', 1),
      ]),
    });

    expect(rollCall.origin).toBe(RollCallOrigin.PREVIOUS_SESSION);
    expect(rollCall.referenceSession).toEqual({ id: 'session-0', date: '2026-10-01' });
    expect(rollCall.students).toEqual([
      expect.objectContaining({
        studentId: 'ana',
        seatNumber: 2,
        status: AttendanceStatus.PRESENT,
      }),
      expect.objectContaining({
        studentId: 'bruno',
        seatNumber: 1,
        status: AttendanceStatus.PRESENT,
      }),
    ]);
  });

  it('leaves outside the table, with no status, whoever was not seated before', () => {
    const rollCall = buildRollCall({
      sessionId: 'session-1',
      enrolled: [ana, bruno],
      recorded: [],
      previous: previous([
        seated('ana', 1),
        {
          studentId: 'bruno',
          status: AttendanceStatus.EXCUSED,
          seatNumber: null,
          justification: 'Atestado',
        },
      ]),
    });

    expect(rollCall.students[1]).toMatchObject({
      studentId: 'bruno',
      seatNumber: null,
      status: null,
      justification: null,
    });
    expect(rollCall.totals).toEqual({ present: 1, late: 0, excused: 0, absent: 0, unrecorded: 1 });
  });

  it('places a student who joined after the previous session outside the table', () => {
    const rollCall = buildRollCall({
      sessionId: 'session-1',
      enrolled: [ana, bruno, carla],
      recorded: [],
      previous: previous([seated('ana', 1), seated('bruno', 2)]),
    });

    expect(rollCall.seats).toBe(3);
    expect(rollCall.students.find((s) => s.studentId === 'carla')).toMatchObject({
      seatNumber: null,
      status: null,
    });
  });

  it('ignores a student who left the room since the previous session', () => {
    const rollCall = buildRollCall({
      sessionId: 'session-1',
      enrolled: [ana],
      recorded: [],
      previous: previous([seated('ana', 1), seated('bruno', 2)]),
    });

    expect(rollCall.students.map((s) => s.studentId)).toEqual(['ana']);
  });

  it('drops a previous seat that no longer exists at the smaller table', () => {
    const rollCall = buildRollCall({
      sessionId: 'session-1',
      enrolled: [ana, bruno],
      recorded: [],
      previous: previous([seated('ana', 3), seated('bruno', 1)]),
    });

    expect(rollCall.students[0]).toMatchObject({
      studentId: 'ana',
      seatNumber: null,
      status: null,
    });
  });

  it('returns the saved roll call instead of a suggestion once it was recorded', () => {
    const recordedAt = new Date('2026-10-08T13:00:00Z');
    const rollCall = buildRollCall({
      sessionId: 'session-1',
      enrolled: [ana, bruno],
      recorded: [
        { ...seated('ana', 1), recordedAt: new Date('2026-10-08T12:00:00Z') },
        {
          studentId: 'bruno',
          status: AttendanceStatus.ABSENT,
          seatNumber: null,
          justification: null,
          recordedAt,
        },
      ],
      previous: previous([seated('bruno', 1)]),
    });

    expect(rollCall).toMatchObject({
      origin: RollCallOrigin.RECORDED,
      referenceSession: null,
      recordedAt,
      totals: { present: 1, late: 0, excused: 0, absent: 1, unrecorded: 0 },
    });
  });

  it('lists students by name with their initials', () => {
    const rollCall = buildRollCall({
      sessionId: 'session-1',
      enrolled: [carla, ana],
      recorded: [],
      previous: null,
    });

    expect(rollCall.students.map((s) => [s.name, s.initials])).toEqual([
      ['Ana Souza', 'AS'],
      ['Carla Dias', 'CD'],
    ]);
  });
});

describe('initialsOf', () => {
  it('uses the first and last names', () => {
    expect(initialsOf('maria da silva santos')).toBe('MS');
  });

  it('uses a single letter for a single name', () => {
    expect(initialsOf('  Joana ')).toBe('J');
  });
});
