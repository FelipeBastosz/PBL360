import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type EntityManager } from 'typeorm';

import { firstRowOrNull, requireFirstRow } from '@/shared/database/rows';
import { violatedUniqueConstraint } from '@/shared/database/unique-violation';

import { Room } from '../../domain/entities/room.entity';
import { RoomCodeInUseError } from '../../domain/errors/room-code-in-use.error';
import { ROOM_COLUMNS, type RoomRow } from './room-row';
import { addRoomTutor, hasRoomTutor, removeRoomTutor } from './room-tutor-queries';
import { hasRoomStudent } from './room-student-queries';
import type {
  RoomRepository,
  RoomTutor,
  RoomStudentSummary,
  StudentRoomSummary,
  TutorRoomSummary,
} from '../../domain/repositories/room.repository';

export const ROOM_CODE_CONSTRAINT = 'uq_rooms_room_code';

const TUTOR_ROOM_SUMMARIES_QUERY = `SELECT ${ROOM_COLUMNS},
              (SELECT COUNT(*)::int FROM room_students members WHERE members.room_id = rooms.id) AS "totalStudents",
              (SELECT COUNT(*)::int FROM problems WHERE problems.room_id = rooms.id) AS "totalProblems"
         FROM rooms
        WHERE deleted_at IS NULL
          AND EXISTS (
            SELECT 1
            FROM room_tutors
            WHERE room_tutors.room_id = rooms.id
              AND room_tutors.tutor_id = $1
          )
        ORDER BY created_at ASC, id ASC;`;

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

  async findSummariesByTutorId(tutorId: string): Promise<TutorRoomSummary[]> {
    const rows = await this.rooms.query<
      Array<RoomRow & { totalStudents: number; totalProblems: number }>
    >(TUTOR_ROOM_SUMMARIES_QUERY, [tutorId]);

    return rows.map(({ totalStudents, totalProblems, ...row }) => ({
      room: this.toEntity(row),
      totalStudents,
      totalProblems,
    }));
  }

  async findForStudent(studentId: string): Promise<StudentRoomSummary[]> {
    const rows = await this.rooms.query<StudentRoomSummary[]>(
      `SELECT rooms.id AS "roomId", rooms.name, rooms.semester,
              COUNT(members.student_id)::int AS "totalStudents",
              (SELECT COUNT(*)::int FROM problems WHERE problems.room_id = rooms.id) AS "totalProblems"
         FROM room_students enrollment
         JOIN rooms ON rooms.id = enrollment.room_id
         JOIN room_students members ON members.room_id = rooms.id
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
      `SELECT users.name, enrollment.joined_at AS "joinedAt"
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

  async addTutor(roomId: string, tutorId: string, actorId: string): Promise<boolean> {
    return addRoomTutor(this.rooms, roomId, tutorId, actorId);
  }

  async hasTutor(roomId: string, tutorId: string): Promise<boolean> {
    return hasRoomTutor(this.rooms, roomId, tutorId);
  }

  hasStudent(roomId: string, studentId: string): Promise<boolean> {
    return hasRoomStudent(this.rooms, roomId, studentId);
  }

  listTutors(roomId: string): Promise<RoomTutor[]> {
    return this.rooms.query<RoomTutor[]>(
      `SELECT u.id, u.name, u.email,
          (u.id = r.tutor_id) AS "isResponsible"
        FROM room_tutors rt
        JOIN users u ON u.id = rt.tutor_id
        JOIN rooms r ON r.id = rt.room_id
        WHERE rt.room_id = $1 AND r.deleted_at IS NULL
        ORDER BY "isResponsible" DESC, u.name ASC, u.id ASC;`,
      [roomId],
    );
  }

  async removeTutor(roomId: string, tutorId: string, actorId: string): Promise<boolean> {
    return removeRoomTutor(this.rooms, roomId, tutorId, actorId);
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
    await manager.query(
      `INSERT INTO room_tutor_events (room_id, tutor_id, actor_id, action)
        VALUES ($1, $2, $2, 'ADDED');`,
      [row.id, room.tutorId],
    );

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
