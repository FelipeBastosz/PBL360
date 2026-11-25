import type { EntityManager, Repository } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import type { Room } from '../../domain/entities/room.entity';

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

export const fetchTutorSummary = async (
  queryRunner: { query: EntityManager['query'] },
  tutorId: string,
): Promise<{ name: string; email: string } | undefined> => {
  const [tutor] = await queryRunner.query<{ name: string; email: string }[]>(
    'SELECT name, email FROM users WHERE id = $1 LIMIT 1;',
    [tutorId],
  );
  return tutor;
};

export const toRoomEntity = (rooms: Repository<Room>, row: RoomRow): Room => {
  const { tutorName, tutorEmail, ...baseRow } = row;
  const room = rooms.create(baseRow);
  if (baseRow.tutorId && tutorName) {
    room.tutor = Object.assign(new User(), {
      id: baseRow.tutorId,
      name: tutorName,
      email: tutorEmail ?? '',
    });
  }
  return room;
};
