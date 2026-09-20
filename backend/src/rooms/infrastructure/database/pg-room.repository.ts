import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Room } from '../../domain/entities/room.entity';
import type { RoomRepository } from '../../domain/repositories/room.repository';

interface RoomRow {
  id: string;
  tutorId: string;
  name: string;
  code: string;
  accessToken: string;
  semester: string;
  active: boolean;
  createdAt: Date;
}

const ROOM_COLUMNS = `
  id,
  tutor_id AS "tutorId",
  name,
  code,
  access_token AS "accessToken",
  semester,
  active,
  created_at AS "createdAt"`;

@Injectable()
export class PgRoomRepository implements RoomRepository {
  constructor(
    @InjectRepository(Room)
    private readonly rooms: Repository<Room>,
  ) {}

  findById(id: string): Promise<Room | null> {
    return this.queryOne(
      `SELECT ${ROOM_COLUMNS}
        FROM rooms
        WHERE id = $1
        LIMIT 1;`,
      [id],
    );
  }

  findByCode(code: string): Promise<Room | null> {
    return this.queryOne(
      `SELECT ${ROOM_COLUMNS}
        FROM rooms
        WHERE code = $1
        LIMIT 1;`,
      [code],
    );
  }

  findByAccessToken(accessToken: string): Promise<Room | null> {
    return this.queryOne(
      `SELECT ${ROOM_COLUMNS}
      FROM rooms
      WHERE access_token = $1
      LIMIT 1;`,
      [accessToken],
    );
  }

  async save(room: Room): Promise<Room> {
    const rows = await this.rooms.query<RoomRow[]>(
      `INSERT INTO rooms (
        tutor_id, name, code, access_token, semester, active
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${ROOM_COLUMNS};`,
      [room.tutorId, room.name, room.code, room.accessToken, room.semester, room.active],
    );

    if (rows.length === 0) {
      throw new Error('Failed to persist room in database.');
    }

    return this.toEntity(rows[0]);
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
       SET name = $1
       WHERE id = $2
       RETURNING ${ROOM_COLUMNS};`,
      [room.name, room.id],
    );

    if (rows.length === 0) {
      throw new Error('Sala não encontrada para edição.');
    }

    return this.toEntity(rows[0]);
  }

  private toEntity(row: RoomRow): Room {
    return this.rooms.create(row);
  }
}
