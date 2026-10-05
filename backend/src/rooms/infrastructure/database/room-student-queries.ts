import type { Repository } from 'typeorm';
import type { Room } from '../../domain/entities/room.entity';

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
