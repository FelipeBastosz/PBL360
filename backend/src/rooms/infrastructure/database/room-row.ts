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
