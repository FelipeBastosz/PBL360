import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../domain/entities/session.entity';
import type {
  RoomSessionRepository,
  RoomSessionSummary,
} from '../../domain/repositories/room-session.repository';

const ROOM_SESSIONS_SQL = `
  SELECT s.id, s.title, to_char(s.date, 'YYYY-MM-DD') AS date,
         s.order_index AS "orderIndex", s.status,
         p.id AS "problemId", p.title AS "problemTitle"
  FROM sessions s
  JOIN problems p ON p.id = s.problem_id
  WHERE p.room_id = $1
  ORDER BY s.date DESC, p.order_index ASC, s.order_index ASC;`;

@Injectable()
export class PgRoomSessionRepository implements RoomSessionRepository {
  constructor(@InjectRepository(Session) private readonly sessions: Repository<Session>) {}

  findByRoom(roomId: string): Promise<RoomSessionSummary[]> {
    return this.sessions.query<RoomSessionSummary[]>(ROOM_SESSIONS_SQL, [roomId]);
  }
}
