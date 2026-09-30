import type { Repository } from 'typeorm';
import type { Room } from '../../domain/entities/room.entity';

type RoomQuery = Pick<Repository<Room>, 'query'>;
const ADD_TUTOR_SQL = `WITH added AS (
  INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2)
  ON CONFLICT DO NOTHING RETURNING room_id, tutor_id
), recorded AS (
  INSERT INTO room_tutor_events (room_id, tutor_id, actor_id, action)
  SELECT room_id, tutor_id, $3, 'ADDED' FROM added RETURNING id
)
SELECT EXISTS (SELECT 1 FROM added) AS changed;`;
const HAS_TUTOR_SQL = `SELECT EXISTS (
  SELECT 1 FROM room_tutors WHERE room_id = $1 AND tutor_id = $2
) AS "exists";`;
const REMOVE_TUTOR_SQL = `WITH removed AS (
  DELETE FROM room_tutors WHERE room_id = $1 AND tutor_id = $2
  RETURNING room_id, tutor_id
), recorded AS (
  INSERT INTO room_tutor_events (room_id, tutor_id, actor_id, action)
  SELECT room_id, tutor_id, $3, 'REMOVED' FROM removed RETURNING id
)
SELECT EXISTS (SELECT 1 FROM removed) AS changed;`;

export const addRoomTutor = async (
  rooms: RoomQuery,
  roomId: string,
  tutorId: string,
  actorId: string,
): Promise<boolean> => {
  const [result] = await rooms.query<{ changed: boolean }[]>(ADD_TUTOR_SQL, [
    roomId,
    tutorId,
    actorId,
  ]);
  return result?.changed ?? false;
};

export const hasRoomTutor = async (
  rooms: RoomQuery,
  roomId: string,
  tutorId: string,
): Promise<boolean> => {
  const [result] = await rooms.query<{ exists: boolean }[]>(HAS_TUTOR_SQL, [roomId, tutorId]);
  return result?.exists ?? false;
};

export const removeRoomTutor = async (
  rooms: RoomQuery,
  roomId: string,
  tutorId: string,
  actorId: string,
): Promise<boolean> => {
  const [result] = await rooms.query<{ changed: boolean }[]>(REMOVE_TUTOR_SQL, [
    roomId,
    tutorId,
    actorId,
  ]);
  return result?.changed ?? false;
};
