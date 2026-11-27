import { getMetadataArgsStorage } from 'typeorm';
import { RoomStudent } from '@/rooms/domain/entities/room-student.entity';
import { Attendance } from './attendance.entity';
import { SessionGeneralEvaluation } from './session-general-evaluation.entity';
import { SessionRoleAssignment } from './session-role.entity';

describe('session and room entity metadata', () => {
  const storage = getMetadataArgsStorage();
  const columnNames = (target: object) =>
    storage.columns
      .filter((column) => column.target === target)
      .map((column) => column.propertyName);

  it('models attendance identity, seat and excused-absence invariants', () => {
    expect(
      storage.tables.some((table) => table.target === Attendance && table.name === 'attendances'),
    ).toBe(true);
    expect(columnNames(Attendance)).toEqual(
      expect.arrayContaining(['sessionId', 'studentId', 'status', 'seatNumber', 'justification']),
    );
    const attendanceChecks = storage.checks
      .filter((check) => check.target === Attendance)
      .map((check) => check.expression);
    expect(attendanceChecks).toEqual(
      expect.arrayContaining([
        'seat_number IS NULL OR seat_number >= 1',
        expect.stringContaining("status IN ('PRESENT', 'LATE')"),
        expect.stringContaining("status = 'EXCUSED'"),
      ]),
    );
  });

  it('enforces unique student roles and bounded role scores', () => {
    expect(
      storage.tables.some(
        (table) => table.target === SessionRoleAssignment && table.name === 'session_roles',
      ),
    ).toBe(true);
    expect(columnNames(SessionRoleAssignment)).toEqual(
      expect.arrayContaining(['sessionId', 'studentId', 'role', 'roleScore']),
    );
    expect(
      storage.checks.find((check) => check.target === SessionRoleAssignment)?.expression,
    ).toContain('role_score');
    expect(
      storage.uniques.some(
        (unique) =>
          unique.target === SessionRoleAssignment &&
          unique.name === 'uq_session_roles_session_role',
      ),
    ).toBe(true);
  });

  it('models one general evaluation per session and author and room membership keys', () => {
    expect(
      storage.tables.some(
        (table) =>
          table.target === SessionGeneralEvaluation && table.name === 'session_general_evaluations',
      ),
    ).toBe(true);
    expect(
      storage.uniques.some(
        (unique) =>
          unique.target === SessionGeneralEvaluation &&
          unique.name === 'uq_session_general_evaluations_session_author',
      ),
    ).toBe(true);
    expect(columnNames(SessionGeneralEvaluation)).toEqual(
      expect.arrayContaining(['sessionId', 'text', 'createdBy', 'updatedBy']),
    );
    expect(
      storage.tables.some(
        (table) => table.target === RoomStudent && table.name === 'room_students',
      ),
    ).toBe(true);
    expect(columnNames(RoomStudent)).toEqual(
      expect.arrayContaining(['roomId', 'studentId', 'joinedAt']),
    );
  });
});
