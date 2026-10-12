import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';
import { ConflictError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { SessionRoleAssignment } from '../../domain/entities/session-role.entity';
import { SessionRole } from '../../domain/enums/session-role.enum';
import type {
  SessionRoleListItem,
  SessionRoleRepository,
} from '../../domain/repositories/session-role.repository';

@Injectable()
export class PgSessionRoleRepository implements SessionRoleRepository {
  constructor(
    @InjectRepository(SessionRoleAssignment)
    private readonly assignments: Repository<SessionRoleAssignment>,
  ) {}

  async list(sessionId: string): Promise<SessionRoleListItem[]> {
    return this.assignments.query<SessionRoleListItem[]>(
      `SELECT sr.student_id AS "studentId", u.name,
              sr.role, sr.role_score AS "roleScore"
       FROM session_roles sr
       JOIN users u ON u.id = sr.student_id
       WHERE sr.session_id = $1
       ORDER BY sr.role;`,
      [sessionId],
    );
  }

  async assign(
    sessionId: string,
    roomId: string,
    studentId: string,
    role: SessionRole | null,
    roleScore: number | null,
    transfer: boolean,
  ): Promise<{ studentId: string; role: SessionRole | null; roleScore: number | null }> {
    return this.assignments.manager.transaction(async (manager) => {
      await this.assertEnrolled(manager, roomId, studentId);
      if (role === null) return this.remove(manager, sessionId, studentId);
      await this.transferIfOccupied(manager, sessionId, studentId, role, transfer);
      await this.upsert(manager, sessionId, studentId, role, roleScore);
      return { studentId, role, roleScore };
    });
  }

  private async assertEnrolled(
    manager: EntityManager,
    roomId: string,
    studentId: string,
  ): Promise<void> {
    const rows = await manager.query<Array<{ studentId: string }>>(
      `SELECT student_id AS "studentId"
       FROM room_students
       WHERE room_id = $1 AND student_id = $2
       FOR SHARE;`,
      [roomId, studentId],
    );
    if (rows.length === 0) {
      throw new UnprocessableEntityError('O aluno não está matriculado na sala.');
    }
  }

  private async remove(manager: EntityManager, sessionId: string, studentId: string) {
    await manager.query(`DELETE FROM session_roles WHERE session_id = $1 AND student_id = $2;`, [
      sessionId,
      studentId,
    ]);
    return { studentId, role: null, roleScore: null };
  }

  private async transferIfOccupied(
    manager: EntityManager,
    sessionId: string,
    studentId: string,
    role: SessionRole,
    transfer: boolean,
  ): Promise<void> {
    const occupied = await this.findOccupied(manager, sessionId, role);
    const current = occupied[0];
    if (!current || current.studentId === studentId) return;
    if (!transfer) {
      throw new ConflictError('O papel já está ocupado.', { ocupadoPor: current });
    }
    await this.deleteRole(manager, sessionId, role);
  }

  private findOccupied(manager: EntityManager, sessionId: string, role: SessionRole) {
    return manager.query<Array<{ studentId: string; name: string }>>(
      `SELECT sr.student_id AS "studentId", u.name
       FROM session_roles sr
       JOIN users u ON u.id = sr.student_id
       WHERE sr.session_id = $1 AND sr.role = $2
       FOR UPDATE;`,
      [sessionId, role],
    );
  }

  private deleteRole(manager: EntityManager, sessionId: string, role: SessionRole) {
    return manager.query(`DELETE FROM session_roles WHERE session_id = $1 AND role = $2;`, [
      sessionId,
      role,
    ]);
  }

  private upsert(
    manager: EntityManager,
    sessionId: string,
    studentId: string,
    role: SessionRole,
    roleScore: number | null,
  ) {
    return manager.query(
      `INSERT INTO session_roles (session_id, student_id, role, role_score)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id, student_id)
       DO UPDATE SET role = EXCLUDED.role, role_score = EXCLUDED.role_score;`,
      [sessionId, studentId, role, roleScore],
    );
  }
}
