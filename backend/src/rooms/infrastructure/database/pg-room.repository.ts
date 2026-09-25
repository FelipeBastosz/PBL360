import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type EntityManager } from 'typeorm';

import { violatedUniqueConstraint } from '@/shared/database/unique-violation';

import { Room } from '../../domain/entities/room.entity';
import { RoomCodeInUseError } from '../../domain/errors/room-code-in-use.error';
import type { RoomRepository } from '../../domain/repositories/room.repository';

export const ROOM_CODE_CONSTRAINT = 'uq_rooms_room_code';

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

  async create(room: Room): Promise<Room> {
    try {
      return await this.rooms.manager.transaction((manager) => this.insertWithOwner(manager, room));
    } catch (error) {
      throw violatedUniqueConstraint(error) === ROOM_CODE_CONSTRAINT
        ? new RoomCodeInUseError(room.roomCode)
        : error;
    }
  }

  findById(id: string): Promise<Room | null> {
    return this.queryOne(
      `SELECT ${ROOM_COLUMNS}
        FROM rooms
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1;`,
      [id],
    );
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

  async update(room: Room): Promise<Room> {
    const [rows] = await this.rooms.query<[RoomRow[], number]>(
      `UPDATE rooms
        SET name = $2, semester = $3, active = $4
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING ${ROOM_COLUMNS};`,
      [room.id, room.name, room.semester, room.active],
    );

    if (rows.length === 0) {
      throw new Error(`Room ${room.id} not found for update.`);
    }

    return this.toEntity(rows[0]);
  }

  async softDelete(room: Room): Promise<void> {
    await this.rooms.query(
      `UPDATE rooms
        SET deleted_at = $2, active = FALSE
        WHERE id = $1
          AND deleted_at IS NULL;`,
      [room.id, room.deletedAt],
    );
  }

  async addTutor(roomId: string, tutorId: string): Promise<boolean> {
    const rows = await this.rooms.query<unknown[]>(
      `INSERT INTO room_tutors (room_id, tutor_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        RETURNING room_id;`,
      [roomId, tutorId],
    );

    return rows.length > 0;
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

  async removeTutor(roomId: string, tutorId: string): Promise<boolean> {
    const [rows] = await this.rooms.query<[unknown[], number]>(
      `DELETE FROM room_tutors
        WHERE room_id = $1
          AND tutor_id = $2
        RETURNING tutor_id;`,
      [roomId, tutorId],
    );

    return rows.length > 0;
  }

  private async insertWithOwner(manager: EntityManager, room: Room): Promise<Room> {
    const [row] = await manager.query<RoomRow[]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING ${ROOM_COLUMNS};`,
      [room.tutorId, room.name, room.courseCode, room.roomCode, room.semester, room.active],
    );

    await manager.query(`INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);`, [
      row.id,
      room.tutorId,
    ]);

    return this.toEntity(row);
  }

  private async queryOne(sql: string, params: unknown[]): Promise<Room | null> {
    const rows = await this.rooms.query<RoomRow[]>(sql, params);

    return rows.length > 0 ? this.toEntity(rows[0]) : null;
  }

  private toEntity(row: RoomRow): Room {
    return this.rooms.create({ ...row, deletedAt: row.deletedAt ?? undefined });
  }
}
