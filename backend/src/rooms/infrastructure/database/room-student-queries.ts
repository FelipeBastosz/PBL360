import type { Repository } from 'typeorm';
import type { Room } from '../../domain/entities/room.entity';
import type {
  RoomStudentSummary,
  StudentRoomSummary,
} from '../../domain/repositories/room.repository';

export const hasRoomStudent = async (
  rooms: Repository<Room>,
  roomId: string,
  studentId: string,
): Promise<boolean> => {
  const [row] = await rooms.query<Array<{ enrolled: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM room_students WHERE room_id = $1 AND student_id = $2
     ) AS enrolled;`,
    [roomId, studentId],
  );
  return Boolean(row?.enrolled);
};

export const listRoomStudents = (
  rooms: Repository<Room>,
  roomId: string,
): Promise<RoomStudentSummary[]> =>
  rooms.query<RoomStudentSummary[]>(
    `SELECT users.id, users.name, users.email,
            users.registration_number AS "registrationNumber",
            enrollment.joined_at AS "joinedAt"
       FROM room_students enrollment
       JOIN users ON users.id = enrollment.student_id
      WHERE enrollment.room_id = $1
        AND users.type = 'STUDENT'
      ORDER BY enrollment.joined_at ASC, users.name ASC;`,
    [roomId],
  );

interface StudentRoomRow {
  roomId: string;
  name: string;
  semester: string;
  tutorId: string | null;
  tutorName: string | null;
  tutorEmail: string | null;
  totalStudents: number;
  totalProblems: number;
}

const STUDENT_ROOMS_SQL = `SELECT rooms.id AS "roomId", rooms.name, rooms.semester,
      u.id AS "tutorId", u.name AS "tutorName", u.email AS "tutorEmail",
      COUNT(DISTINCT members.student_id)::int AS "totalStudents",
      COUNT(DISTINCT problems.id)::int AS "totalProblems"
   FROM room_students enrollment
   JOIN rooms ON rooms.id = enrollment.room_id
   LEFT JOIN users u ON u.id = rooms.tutor_id
   JOIN room_students members ON members.room_id = rooms.id
    LEFT JOIN problems ON problems.room_id = rooms.id
  WHERE enrollment.student_id = $1
    AND rooms.deleted_at IS NULL
  GROUP BY rooms.id, rooms.name, rooms.semester, u.id, u.name, u.email
  ORDER BY rooms.semester DESC, rooms.name ASC;`;

const toStudentRoomSummary = (row: StudentRoomRow): StudentRoomSummary => ({
  roomId: row.roomId,
  name: row.name,
  semester: row.semester,
  totalStudents: row.totalStudents,
  totalProblems: row.totalProblems,
  tutor:
    row.tutorId && row.tutorName
      ? {
          id: row.tutorId,
          name: row.tutorName,
          email: row.tutorEmail ?? '',
        }
      : undefined,
});

export const queryStudentRooms = async (
  rooms: Repository<Room>,
  studentId: string,
): Promise<StudentRoomSummary[]> => {
  const rows = await rooms.query<StudentRoomRow[]>(STUDENT_ROOMS_SQL, [studentId]);

  return rows.map(toStudentRoomSummary);
};
