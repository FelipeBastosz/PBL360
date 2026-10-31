import type { Repository } from 'typeorm';
import type { Room } from '../../domain/entities/room.entity';
import type { RoomTutor } from '../../domain/repositories/room.repository';

export async function hasRoomStudent(
  rooms: Repository<Room>,
  roomId: string,
  studentId: string,
): Promise<boolean> {
  const rows = await rooms.query<unknown[]>(
    'SELECT 1 FROM room_students WHERE room_id = $1 AND student_id = $2 LIMIT 1;',
    [roomId, studentId],
  );
  return rows.length > 0;
}

export async function removeRoomStudent(
  rooms: Repository<Room>,
  roomId: string,
  studentId: string,
): Promise<boolean> {
  const [rows] = await rooms.query<[unknown[], number]>(
    `DELETE FROM room_students
      WHERE room_id = $1
        AND student_id = $2
      RETURNING student_id;`,
    [roomId, studentId],
  );
  return rows.length > 0;
}

export async function hasRoomTutor(
  rooms: Repository<Room>,
  roomId: string,
  tutorId: string,
): Promise<boolean> {
  const rows = await rooms.query<{ exists: boolean }[]>(
    `SELECT EXISTS (
        SELECT 1 FROM room_tutors WHERE room_id = $1 AND tutor_id = $2
      ) AS "exists";`,
    [roomId, tutorId],
  );
  return rows[0]?.exists ?? false;
}

export function listRoomTutors(rooms: Repository<Room>, roomId: string): Promise<RoomTutor[]> {
  return rooms.query<RoomTutor[]>(
    `SELECT u.id, u.name, u.email, (u.id = r.tutor_id) AS "isResponsible"
       FROM room_tutors rt
       JOIN users u ON u.id = rt.tutor_id
       JOIN rooms r ON r.id = rt.room_id
      WHERE rt.room_id = $1 AND r.deleted_at IS NULL
      ORDER BY "isResponsible" DESC, u.name ASC, u.id ASC;`,
    [roomId],
  );
}
