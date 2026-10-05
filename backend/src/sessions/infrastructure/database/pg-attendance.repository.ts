import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type EntityManager } from 'typeorm';
import { firstRowOrNull } from '@/shared/database/rows';
import { violatedUniqueConstraint } from '@/shared/database/unique-violation';
import { ConflictError } from '@/shared/errors/application.error';
import { Attendance } from '../../domain/entities/attendance.entity';
import type { AttendanceStatus } from '../../domain/enums/attendance-status.enum';
import type {
  AttendanceRepository,
  SessionReference,
} from '../../domain/repositories/attendance.repository';
import type {
  AttendanceEntry,
  EnrolledStudent,
  PreviousRollCall,
  RecordedAttendance,
} from '../../domain/roll-call/roll-call';

interface AttendanceRow {
  studentId: string;
  status: AttendanceStatus;
  seatNumber: number | null;
  justification: string | null;
  recordedAt: Date;
}

const ATTENDANCE_COLUMNS = `
    student_id AS "studentId",
    status,
    seat_number AS "seatNumber",
    justification,
    recorded_at AS "recordedAt"`;

const SEAT_TAKEN = 'Dois alunos não podem ocupar o mesmo lugar na mesa.';

const PREVIOUS_SESSION_SQL = `
  SELECT s.id, to_char(s.date, 'YYYY-MM-DD') AS date
  FROM sessions s
  JOIN problems p ON p.id = s.problem_id
  JOIN LATERAL (
    SELECT MAX(a.recorded_at) AS last_recorded_at
    FROM attendances a
    WHERE a.session_id = s.id
  ) recorded ON recorded.last_recorded_at IS NOT NULL
  WHERE p.room_id = $1 AND s.id <> $2 AND s.date <= $3
  ORDER BY s.date DESC, recorded.last_recorded_at DESC
  LIMIT 1;`;

const RELEASE_SEATS_SQL = `
  UPDATE attendances SET seat_number = NULL
  WHERE session_id = $1 AND student_id = ANY($2::uuid[]);`;

const UPSERT_BATCH_SQL = `
  INSERT INTO attendances (session_id, student_id, recorded_by, status, justification, seat_number)
  SELECT $1, batch.student_id, $2, batch.status::attendance_status,
         batch.justification, batch.seat_number
  FROM unnest($3::uuid[], $4::text[], $5::text[], $6::smallint[])
    AS batch(student_id, status, justification, seat_number)
  ON CONFLICT ON CONSTRAINT uq_attendances_session_student DO UPDATE SET
    status = EXCLUDED.status,
    justification = EXCLUDED.justification,
    seat_number = EXCLUDED.seat_number,
    recorded_by = EXCLUDED.recorded_by,
    recorded_at = now();`;

@Injectable()
export class PgAttendanceRepository implements AttendanceRepository {
  constructor(@InjectRepository(Attendance) private readonly attendances: Repository<Attendance>) {}

  findEnrolledStudents(roomId: string): Promise<EnrolledStudent[]> {
    return this.attendances.query<EnrolledStudent[]>(
      `SELECT u.id, u.name
        FROM room_students enrollment
        JOIN users u ON u.id = enrollment.student_id
        WHERE enrollment.room_id = $1;`,
      [roomId],
    );
  }

  async findBySession(sessionId: string): Promise<RecordedAttendance[]> {
    const rows = await this.attendances.query<AttendanceRow[]>(
      `SELECT ${ATTENDANCE_COLUMNS} FROM attendances WHERE session_id = $1;`,
      [sessionId],
    );
    return rows.map((row) => ({ ...row, seatNumber: this.toSeat(row.seatNumber) }));
  }

  async findPreviousRollCall(
    roomId: string,
    session: SessionReference,
  ): Promise<PreviousRollCall | null> {
    const rows = await this.attendances.query<Array<{ id: string; date: string }>>(
      PREVIOUS_SESSION_SQL,
      [roomId, session.id, session.date],
    );
    const reference = firstRowOrNull(rows);
    if (!reference) return null;

    const entries = await this.findBySession(reference.id);
    return { sessionId: reference.id, date: reference.date, entries };
  }

  async saveBatch(
    sessionId: string,
    recordedBy: string,
    entries: AttendanceEntry[],
  ): Promise<void> {
    try {
      await this.attendances.manager.transaction((manager) =>
        this.writeBatch(manager, sessionId, recordedBy, entries),
      );
    } catch (error) {
      throw violatedUniqueConstraint(error) === 'uq_attendances_session_seat'
        ? new ConflictError(SEAT_TAKEN)
        : error;
    }
  }

  private async writeBatch(
    manager: EntityManager,
    sessionId: string,
    recordedBy: string,
    entries: AttendanceEntry[],
  ): Promise<void> {
    const studentIds = entries.map((entry) => entry.studentId);
    await manager.query(RELEASE_SEATS_SQL, [sessionId, studentIds]);
    await manager.query(UPSERT_BATCH_SQL, [
      sessionId,
      recordedBy,
      studentIds,
      entries.map((entry) => entry.status),
      entries.map((entry) => entry.justification),
      entries.map((entry) => entry.seatNumber),
    ]);
  }

  private toSeat(seat: number | string | null): number | null {
    return seat === null ? null : Number(seat);
  }
}
