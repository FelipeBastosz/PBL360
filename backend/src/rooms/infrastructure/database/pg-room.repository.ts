import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type EntityManager } from 'typeorm';

import { firstRowOrNull, requireFirstRow } from '@/shared/database/rows';
import { violatedUniqueConstraint } from '@/shared/database/unique-violation';

import { Room } from '../../domain/entities/room.entity';
import { RoomCodeInUseError } from '../../domain/errors/room-code-in-use.error';
import {
  hasRoomStudent,
  hasRoomTutor,
  listRoomTutors,
  removeRoomStudent,
} from './room-member-queries';
import { ROOM_COLUMNS, type RoomRow } from './room-row';
import type {
  RoomRepository,
  RoomTutor,
  RoomStudentSummary,
  StudentRoomSummary,
  TutorRoomSummary,
} from '../../domain/repositories/room.repository';

export const ROOM_CODE_CONSTRAINT = 'uq_rooms_room_code';

interface TutorRoomRow extends RoomRow {
  totalStudents: number;
  totalProblems: number;
}

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

  findByRoomCode(roomCode: string): Promise<Room | null> {
    return this.queryOne(
      `SELECT ${ROOM_COLUMNS}
        FROM rooms
        WHERE room_code = $1
          AND deleted_at IS NULL
        LIMIT 1;`,
      [roomCode],
    );
  }

  async joinStudent(roomId: string, studentId: string): Promise<void> {
    await this.rooms.query(
      `INSERT INTO room_students (room_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT (room_id, student_id) DO NOTHING;`,
      [roomId, studentId],
    );
  }

  async findByTutorId(tutorId: string): Promise<TutorRoomSummary[]> {
    const rows = await this.rooms.query<TutorRoomRow[]>(
      `SELECT ${ROOM_COLUMNS},
            (SELECT COUNT(*)::int FROM room_students members
              WHERE members.room_id = rooms.id) AS "totalStudents",
            (SELECT COUNT(*)::int FROM problems
              WHERE problems.room_id = rooms.id) AS "totalProblems"
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

    return rows.map((row) => this.toTutorSummary(row));
  }

  private toTutorSummary(row: TutorRoomRow): TutorRoomSummary {
    const { totalStudents, totalProblems, ...roomRow } = row;
    return { room: this.toEntity(roomRow), totalStudents, totalProblems };
  }

  async findForStudent(studentId: string): Promise<StudentRoomSummary[]> {
    const rows = await this.rooms.query<StudentRoomSummary[]>(
      `SELECT rooms.id AS "roomId", rooms.name, rooms.semester,
            COUNT(DISTINCT members.student_id)::int AS "totalStudents",
            COUNT(DISTINCT problems.id)::int AS "totalProblems"
         FROM room_students enrollment
         JOIN rooms ON rooms.id = enrollment.room_id
         JOIN room_students members ON members.room_id = rooms.id
          LEFT JOIN problems ON problems.room_id = rooms.id
        WHERE enrollment.student_id = $1
          AND rooms.deleted_at IS NULL
        GROUP BY rooms.id, rooms.name, rooms.semester
        ORDER BY rooms.semester DESC, rooms.name ASC;`,
      [studentId],
    );

    return rows;
  }

  async findStudents(roomId: string): Promise<RoomStudentSummary[]> {
    return this.rooms.query<RoomStudentSummary[]>(
      `SELECT users.id, users.name, users.email,
              users.registration_number AS "registrationNumber",
              enrollment.joined_at AS "joinedAt"
         FROM room_students enrollment
         JOIN users ON users.id = enrollment.student_id
        WHERE enrollment.room_id = $1
          AND users.type = 'STUDENT'
        ORDER BY enrollment.joined_at ASC, users.name ASC;`,
      [roomId],
    );
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

    return this.toEntity(requireFirstRow(rows, `Room ${room.id} not found for update.`));
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
    return hasRoomTutor(this.rooms, roomId, tutorId);
  }

  hasStudent(roomId: string, studentId: string): Promise<boolean> {
    return hasRoomStudent(this.rooms, roomId, studentId);
  }

  listTutors(roomId: string): Promise<RoomTutor[]> {
    return listRoomTutors(this.rooms, roomId);
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

  removeStudent(roomId: string, studentId: string): Promise<boolean> {
    return removeRoomStudent(this.rooms, roomId, studentId);
  }

  private async insertWithOwner(manager: EntityManager, room: Room): Promise<Room> {
    const rows = await manager.query<RoomRow[]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING ${ROOM_COLUMNS};`,
      [room.tutorId, room.name, room.courseCode, room.roomCode, room.semester, room.active],
    );
    const row = requireFirstRow(rows, 'Failed to persist room.');

    await manager.query(`INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);`, [
      row.id,
      room.tutorId,
    ]);

    return this.toEntity(row);
  }

  private async queryOne(sql: string, params: unknown[]): Promise<Room | null> {
    const rows = await this.rooms.query<RoomRow[]>(sql, params);

    const row = firstRowOrNull(rows);

    return row ? this.toEntity(row) : null;
  }

  private toEntity(row: RoomRow): Room {
    return this.rooms.create(row);
  }
}
