import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';
import { ConflictError } from '@/shared/errors/application.error';
import { firstRowOrNull, requireFirstRow } from '@/shared/database/rows';
import { Session } from '../../domain/entities/session.entity';
import { countReleaseSubmissions } from './evaluation-release.queries';
import type {
  ReleaseSubmissions,
  SessionDeletionImpact,
  SessionRepository,
} from '../../domain/repositories/session.repository';

interface SessionRow {
  id: string;
  problemId: string;
  title: string;
  description: string | null;
  date: string;
  orderIndex: number;
  status: string;
  selfEvalReleased: boolean;
  peerEvalReleased: boolean;
  selfEvalDeadline: Date | null;
  peerEvalDeadline: Date | null;
  releasedAt: Date | null;
  releasedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SESSION_COLUMNS = `
  id,
  problem_id AS "problemId",
  title,
  description,
  to_char(date, 'YYYY-MM-DD') AS date,
  order_index AS "orderIndex",
  status,
  self_eval_released AS "selfEvalReleased",
  peer_eval_released AS "peerEvalReleased",
  self_eval_deadline AS "selfEvalDeadline",
  peer_eval_deadline AS "peerEvalDeadline",
  released_at AS "releasedAt",
  released_by AS "releasedBy",
  created_at AS "createdAt",
  updated_at AS "updatedAt"`;

@Injectable()
export class PgSessionRepository implements SessionRepository {
  constructor(@InjectRepository(Session) private readonly sessions: Repository<Session>) {}

  create(session: Session): Promise<Session> {
    return this.sessions.manager.transaction(async (manager) => {
      await manager.query(`SELECT id FROM problems WHERE id = $1 FOR UPDATE;`, [session.problemId]);
      return this.insertWithNextOrder(manager, session);
    });
  }

  save(session: Session): Promise<Session> {
    return this.sessions.save(session);
  }

  async findById(id: string): Promise<Session | null> {
    const rows = await this.sessions.query<SessionRow[]>(
      `SELECT ${SESSION_COLUMNS} FROM sessions WHERE id = $1 LIMIT 1;`,
      [id],
    );
    const row = firstRowOrNull(rows);
    return row ? this.toEntity(row) : null;
  }

  async findByProblemId(problemId: string): Promise<Session[]> {
    const rows = await this.sessions.query<SessionRow[]>(
      `SELECT ${SESSION_COLUMNS}
       FROM sessions
       WHERE problem_id = $1
       ORDER BY date ASC, order_index ASC;`,
      [problemId],
    );
    return rows.map((row) => this.toEntity(row));
  }

  async getDeletionImpact(sessionId: string): Promise<SessionDeletionImpact> {
    const evaluations = await this.countEvaluations(this.sessions.manager, sessionId);
    return { chamada: 0, papeis: 0, observacoes: 0, avaliacoes: evaluations, feedbacks: 0 };
  }

  countReleaseSubmissions(sessionId: string): Promise<ReleaseSubmissions> {
    return countReleaseSubmissions(this.sessions.manager, sessionId);
  }

  private async countEvaluations(manager: EntityManager, sessionId: string): Promise<number> {
    const [row] = await manager.query<{ count: string }[]>(
      'SELECT COUNT(*) AS count FROM evaluations WHERE session_id = $1;',
      [sessionId],
    );
    return Number(row?.count ?? 0);
  }

  async delete(id: string, problemId: string): Promise<void> {
    await this.sessions.manager.transaction(async (manager) => {
      await manager.query(`SELECT id FROM problems WHERE id = $1 FOR UPDATE;`, [problemId]);
      const targetRows = await manager.query<Array<{ orderIndex: number }>>(
        `SELECT order_index AS "orderIndex" FROM sessions WHERE id = $1 AND problem_id = $2 FOR UPDATE;`,
        [id, problemId],
      );
      const target = firstRowOrNull(targetRows);
      if (!target) return;
      if (await this.countEvaluations(manager, id)) {
        throw new ConflictError('A sessão possui avaliações e não pode ser excluída.');
      }
      await manager.query(`DELETE FROM sessions WHERE id = $1;`, [id]);
      await this.decrementFollowingOrders(manager, problemId, Number(target.orderIndex));
    });
  }

  private async insertWithNextOrder(manager: EntityManager, session: Session): Promise<Session> {
    const rows = await manager.query<SessionRow[]>(
      `INSERT INTO sessions (problem_id, title, description, date, order_index, status)
       SELECT $1, $2, $3, $4::date, COALESCE(MAX(order_index), 0) + 1, $5
       FROM sessions WHERE problem_id = $1
       RETURNING ${SESSION_COLUMNS};`,
      [session.problemId, session.title, session.description, session.date, session.status],
    );
    return this.toEntity(requireFirstRow(rows, 'Failed to persist session.'));
  }

  private async decrementFollowingOrders(
    manager: EntityManager,
    problemId: string,
    orderIndex: number,
  ): Promise<void> {
    await manager.query(
      `UPDATE sessions SET order_index = -order_index WHERE problem_id = $1 AND order_index > $2;`,
      [problemId, orderIndex],
    );
    await manager.query(
      `UPDATE sessions SET order_index = -order_index - 1 WHERE problem_id = $1 AND order_index < 0;`,
      [problemId],
    );
  }

  private toEntity(row: SessionRow): Session {
    return Object.assign(new Session(), row, { orderIndex: Number(row.orderIndex) });
  }
}
