import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type EntityManager } from 'typeorm';

import { firstRowOrNull, requireFirstRow } from '@/shared/database/rows';
import { violatedUniqueConstraint } from '@/shared/database/unique-violation';

import { Room } from '../../domain/entities/room.entity';
import { User } from '@/users/domain/entities/user.entity';
import { RoomCodeInUseError } from '../../domain/errors/room-code-in-use.error';
import { hasRoomStudent, hasRoomTutor, listRoomTutors } from './room-member-queries';
import { listRoomStudents, queryStudentRooms } from './room-student-queries';
import { ROOM_COLUMNS, ROOM_WITH_TUTOR_COLUMNS, type RoomRow } from './room-row';
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

const fetchTutor = async (
  queryRunner: { query: EntityManager['query'] },
  tutorId: string,
): Promise<{ name: string; email: string } | undefined> => {
  const [tutor] = await queryRunner.query<{ name: string; email: string }[]>(
    'SELECT name, email FROM users WHERE id = $1 LIMIT 1;',
    [tutorId],
  );
  return tutor;
};

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
      `SELECT ${ROOM_WITH_TUTOR_COLUMNS}
        FROM rooms
        LEFT JOIN users u ON u.id = rooms.tutor_id
        WHERE rooms.id = $1
          AND rooms.deleted_at IS NULL
        LIMIT 1;`,
      [id],
    );
  }

  findByRoomCode(roomCode: string): Promise<Room | null> {
    return this.queryOne(
      `SELECT ${ROOM_WITH_TUTOR_COLUMNS}
        FROM rooms
        LEFT JOIN users u ON u.id = rooms.tutor_id
        WHERE rooms.room_code = $1
          AND rooms.deleted_at IS NULL
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
      `SELECT ${ROOM_WITH_TUTOR_COLUMNS},
            (SELECT COUNT(*)::int FROM room_students WHERE room_id = rooms.id) AS "totalStudents",
            (SELECT COUNT(*)::int FROM problems WHERE room_id = rooms.id) AS "totalProblems"
        FROM rooms
        LEFT JOIN users u ON u.id = rooms.tutor_id
        WHERE rooms.deleted_at IS NULL
          AND EXISTS (
            SELECT 1 FROM room_tutors WHERE room_id = rooms.id AND tutor_id = $1
          )
        ORDER BY rooms.created_at ASC, rooms.id ASC;`,
      [tutorId],
    );

    return rows.map((row) => this.toTutorSummary(row));
  }

  findForStudent(studentId: string): Promise<StudentRoomSummary[]> {
    return queryStudentRooms(this.rooms, studentId);
  }

  findStudents(roomId: string): Promise<RoomStudentSummary[]> {
    return listRoomStudents(this.rooms, roomId);
  }

  async update(room: Room): Promise<Room> {
    const [rows] = await this.rooms.query<[RoomRow[], number]>(
      `UPDATE rooms SET name = $2, semester = $3, active = $4
        WHERE id = $1 AND deleted_at IS NULL RETURNING ${ROOM_COLUMNS};`,
      [room.id, room.name, room.semester, room.active],
    );
    const updatedRow = requireFirstRow(rows, `Room ${room.id} not found for update.`);
    const tutor = await fetchTutor(this.rooms, updatedRow.tutorId);

    return this.toEntity({
      ...updatedRow,
      tutorName: tutor?.name,
      tutorEmail: tutor?.email,
    });
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

  private async insertWithOwner(manager: EntityManager, room: Room): Promise<Room> {
    const rows = await manager.query<RoomRow[]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${ROOM_COLUMNS};`,
      [room.tutorId, room.name, room.courseCode, room.roomCode, room.semester, room.active],
    );
    const row = requireFirstRow(rows, 'Failed to persist room.');

    await manager.query(`INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);`, [
      row.id,
      room.tutorId,
    ]);
    const tutor = await fetchTutor(manager, room.tutorId);

    return this.toEntity({
      ...row,
      tutorName: tutor?.name,
      tutorEmail: tutor?.email,
    });
  }

  private async queryOne(sql: string, params: unknown[]): Promise<Room | null> {
    const rows = await this.rooms.query<RoomRow[]>(sql, params);
    const row = firstRowOrNull(rows);

    return row ? this.toEntity(row) : null;
  }

  private toTutorSummary(row: TutorRoomRow): TutorRoomSummary {
    const { totalStudents, totalProblems, ...roomRow } = row;
    return { room: this.toEntity(roomRow), totalStudents, totalProblems };
  }

  private toEntity(row: RoomRow): Room {
    const { tutorName, tutorEmail, ...baseRow } = row;
    const room = this.rooms.create(baseRow);
    if (baseRow.tutorId && tutorName) {
      room.tutor = Object.assign(new User(), {
        id: baseRow.tutorId,
        name: tutorName,
        email: tutorEmail ?? '',
      });
    }
    return room;
  }
}
