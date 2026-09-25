import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Room } from '../../domain/entities/room.entity';
import type { RoomRepository } from '../../domain/repositories/room.repository';

interface RoomRow {
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

const ROOM_COLUMNS = `
  id,
  tutor_id AS "tutorId",
  name,
  course_code AS "courseCode",
  room_code AS "roomCode",
  semester,
  active,
  created_at AS "createdAt",
  deleted_at AS "deletedAt"`;

@Injectable()
export class PgRoomRepository implements RoomRepository {
  constructor(
    @InjectRepository(Room)
    private readonly rooms: Repository<Room>,
  ) {}

  async addTutor(roomId: string, tutorId: string): Promise<void> {
    await this.rooms.query(
      `INSERT INTO room_tutors (
        room_id,
        tutor_id
      )
      VALUES ($1, $2);`,
      [roomId, tutorId],
    );
  }

  async hasTutor(roomId: string, tutorId: string): Promise<boolean> {
    const rows = await this.rooms.query<{ exists: boolean }[]>(
      `SELECT EXISTS (
        SELECT 1
        FROM room_tutors
        WHERE room_id = $1
          AND tutor_id = $2
      ) AS "exists";`,
      [roomId, tutorId],
    );

    return rows[0]?.exists ?? false;
  }

  async findByTutorId(tutorId: string): Promise<Room[]> {
    const rows = await this.rooms.query<RoomRow[]>(
      `SELECT ${ROOM_COLUMNS}
      FROM rooms
      WHERE deleted_at IS NULL
        AND EXISTS (
          SELECT 1
          FROM room_tutors
          WHERE room_tutors.room_id = rooms.id
            AND room_tutors.tutor_id = $1
        )
      ORDER BY created_at ASC, id ASC;`,
      [tutorId],
    );

    return rows.map((row) => this.toEntity(row));
  }

  findById(id: string): Promise<Room | null> {
    return this.queryOne(
      `SELECT ${ROOM_COLUMNS}
        FROM rooms
        WHERE id = $1
        LIMIT 1;`,
      [id],
    );
  }

  findByCourseCode(courseCode: string): Promise<Room | null> {
    return this.queryOne(
      `SELECT ${ROOM_COLUMNS}
        FROM rooms
        WHERE course_code = $1
        LIMIT 1;`,
      [courseCode],
    );
  }

  findByRoomCode(roomCode: string): Promise<Room | null> {
    return this.queryOne(
      `SELECT ${ROOM_COLUMNS}
      FROM rooms
      WHERE room_code = $1
      LIMIT 1;`,
      [roomCode],
    );
  }

  async save(room: Room): Promise<Room> {
    return this.rooms.manager.transaction(async (manager): Promise<Room> => {
      const rows = await manager.query<RoomRow[]>(
        `INSERT INTO rooms (
            tutor_id,
            name,
            course_code,
            room_code,
            semester,
            active
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING ${ROOM_COLUMNS};`,
        [room.tutorId, room.name, room.courseCode, room.roomCode, room.semester, room.active],
      );

      if (rows.length === 0) {
        throw new Error('Failed to persist room in database.');
      }

      const savedRoom = rows[0];

      await manager.query(
        `INSERT INTO room_tutors (
            room_id,
            tutor_id
          )
          VALUES ($1, $2);`,
        [savedRoom.id, room.tutorId],
      );

      return this.toEntity(savedRoom);
    });
  }

  private async queryOne(sql: string, params: unknown[]): Promise<Room | null> {
    const rows = await this.rooms.query<RoomRow[]>(sql, params);

    if (rows.length === 0) {
      return null;
    }

    return this.toEntity(rows[0]);
  }

  async update(room: Room): Promise<Room> {
    const rows = await this.rooms.query<RoomRow[]>(
      `UPDATE rooms
      SET
        name = $1,
        semester = $2,
        active = $3
      WHERE id = $4
      RETURNING ${ROOM_COLUMNS};`,
      [room.name, room.semester, room.active, room.id],
    );

    if (rows.length === 0) {
      throw new Error('Sala não encontrada para edição.');
    }

    return this.toEntity(rows[0]);
  }

  private toEntity(row: RoomRow): Room {
    return this.rooms.create(row);
  }

  async removeTutor(roomId: string, tutorId: string): Promise<void> {
    await this.rooms.query(
      `DELETE FROM room_tutors
      WHERE room_id = $1
        AND tutor_id = $2;`,
      [roomId, tutorId],
    );
  }
}
