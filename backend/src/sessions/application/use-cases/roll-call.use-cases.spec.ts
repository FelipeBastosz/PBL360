import {
  ConflictError,
  ForbiddenError,
  InvalidRequestError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import { AttendanceStatus } from '../../domain/enums/attendance-status.enum';
import { InvalidAttendanceError } from '../../domain/errors/invalid-attendance.error';
import type { AttendanceRepository } from '../../domain/repositories/attendance.repository';
import { RollCallOrigin, type AttendanceEntry } from '../../domain/roll-call/roll-call';
import type { SessionAccessService } from '../services/session-access.service';
import { GetRollCallUseCase } from './get-roll-call.use-case';
import { RecordRollCallUseCase } from './record-roll-call.use-case';

const session = { id: 'session-2', date: '2026-10-08', problemId: 'problem-b' };
const enrolled = [
  { id: 'ana', name: 'Ana Souza' },
  { id: 'bruno', name: 'Bruno Lima' },
];

const present = (studentId: string, seatNumber: number | null): AttendanceEntry => ({
  studentId,
  status: AttendanceStatus.PRESENT,
  seatNumber,
  justification: null,
});

describe('Roll call use cases', () => {
  let attendances: jest.Mocked<AttendanceRepository>;
  let access: jest.Mocked<SessionAccessService>;

  beforeEach(() => {
    attendances = {
      findEnrolledStudents: jest.fn().mockResolvedValue(enrolled),
      findBySession: jest.fn().mockResolvedValue([]),
      findPreviousRollCall: jest.fn().mockResolvedValue(null),
      saveBatch: jest.fn().mockResolvedValue(undefined),
    };
    access = {
      assertTutorCanAccessSessionById: jest.fn().mockResolvedValue({ session, roomId: 'room-1' }),
    } as unknown as jest.Mocked<SessionAccessService>;
  });

  describe('GetRollCallUseCase', () => {
    const getRollCall = () =>
      new GetRollCallUseCase(access, attendances).execute('session-2', 'tutor-1');

    it('checks the tutor access before reading anything', async () => {
      access.assertTutorCanAccessSessionById.mockRejectedValue(new ForbiddenError('negado'));

      await expect(getRollCall()).rejects.toBeInstanceOf(ForbiddenError);
      expect(attendances.findBySession).not.toHaveBeenCalled();
    });

    it('looks for the previous roll call across the whole room, up to the session date', async () => {
      attendances.findPreviousRollCall.mockResolvedValue({
        sessionId: 'session-1',
        date: '2026-10-01',
        entries: [present('ana', 1)],
      });

      const rollCall = await getRollCall();

      expect(attendances.findPreviousRollCall).toHaveBeenCalledWith('room-1', {
        id: 'session-2',
        date: '2026-10-08',
      });
      expect(rollCall.origin).toBe(RollCallOrigin.PREVIOUS_SESSION);
      expect(rollCall.referenceSession).toEqual({ id: 'session-1', date: '2026-10-01' });
    });

    it('does not suggest anything once the session has a saved roll call', async () => {
      attendances.findBySession.mockResolvedValue([
        { ...present('ana', 1), recordedAt: new Date('2026-10-08T12:00:00Z') },
      ]);

      const rollCall = await getRollCall();

      expect(attendances.findPreviousRollCall).not.toHaveBeenCalled();
      expect(rollCall.origin).toBe(RollCallOrigin.RECORDED);
    });

    it('answers an empty roll call on the first session of the room', async () => {
      const rollCall = await getRollCall();

      expect(rollCall.origin).toBe(RollCallOrigin.EMPTY);
      expect(rollCall.seats).toBe(2);
    });
  });

  describe('RecordRollCallUseCase', () => {
    const record = (entries: AttendanceEntry[]) =>
      new RecordRollCallUseCase(access, attendances).execute({
        sessionId: 'session-2',
        tutorId: 'tutor-1',
        entries,
      });

    it('saves the batch as the authenticated tutor and answers the recorded roll call', async () => {
      attendances.findBySession.mockResolvedValue([
        { ...present('ana', 2), recordedAt: new Date('2026-10-08T12:00:00Z') },
      ]);

      const rollCall = await record([present('ana', 2)]);

      expect(attendances.saveBatch).toHaveBeenCalledWith('session-2', 'tutor-1', [
        present('ana', 2),
      ]);
      expect(rollCall.origin).toBe(RollCallOrigin.RECORDED);
      expect(rollCall.students[0]).toMatchObject({ studentId: 'ana', seatNumber: 2 });
    });

    it('rejects a seat for an absent student before touching the database', async () => {
      const absentSeated = { ...present('ana', 1), status: AttendanceStatus.ABSENT };

      await expect(record([absentSeated])).rejects.toBeInstanceOf(InvalidAttendanceError);
      expect(attendances.saveBatch).not.toHaveBeenCalled();
    });

    it('rejects a student listed twice', async () => {
      await expect(record([present('ana', 1), present('ana', 2)])).rejects.toBeInstanceOf(
        InvalidRequestError,
      );
    });

    it('rejects a student who is not enrolled in the room', async () => {
      await expect(record([present('carla', 1)])).rejects.toThrow(
        new UnprocessableEntityError('O aluno informado não está matriculado na sala.'),
      );
    });

    it('rejects a seat beyond the table size', async () => {
      await expect(record([present('ana', 3)])).rejects.toThrow(
        new UnprocessableEntityError('O lugar 3 não existe na mesa, que tem 2 lugares.'),
      );
    });

    it('rejects two students in the same seat', async () => {
      await expect(record([present('ana', 1), present('bruno', 1)])).rejects.toBeInstanceOf(
        ConflictError,
      );
      expect(attendances.saveBatch).not.toHaveBeenCalled();
    });

    it('propagates a seat already taken by a student left out of the batch', async () => {
      attendances.saveBatch.mockRejectedValue(new ConflictError('ocupado'));

      await expect(record([present('ana', 1)])).rejects.toBeInstanceOf(ConflictError);
    });
  });
});
