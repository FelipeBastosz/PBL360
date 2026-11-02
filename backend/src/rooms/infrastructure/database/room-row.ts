export interface RoomRow {
  id: string;
  tutorId: string;
  name: string;
  courseCode: string;
  roomCode: string;
  semester: string;
  active: boolean;
  createdAt: Date;
  deletedAt: Date | null;
  tutorName?: string;
  tutorEmail?: string;
}

export const ROOM_COLUMNS = `
  id,
  tutor_id AS "tutorId",
  name,
  course_code AS "courseCode",
  room_code AS "roomCode",
  semester,
  active,
  created_at AS "createdAt",
  deleted_at AS "deletedAt"`;

export const ROOM_WITH_TUTOR_COLUMNS = `
  rooms.id,
  rooms.tutor_id AS "tutorId",
  rooms.name,
  rooms.course_code AS "courseCode",
  rooms.room_code AS "roomCode",
  rooms.semester,
  rooms.active,
  rooms.created_at AS "createdAt",
  rooms.deleted_at AS "deletedAt",
  u.name AS "tutorName",
  u.email AS "tutorEmail"`;
