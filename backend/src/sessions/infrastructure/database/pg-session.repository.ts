import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';
import { ConflictError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { firstRowOrNull, requireFirstRow } from '@/shared/database/rows';
import { Session } from '../../domain/entities/session.entity';
import { countReleaseSubmissions } from './evaluation-release.queries';
import { SESSION_COLUMNS, type SessionRow } from './session-row';
import { createSessionPerformanceTableCopy } from './session-performance-table-copy.persistence';
import type {
  ReleaseSubmissions,
  SessionDeletionImpact,
  SessionRepository,
} from '../../domain/repositories/session.repository';

@Injectable()
export class PgSessionRepository implements SessionRepository {
  constructor(@InjectRepository(Session) private readonly sessions: Repository<Session>) {}

  create(session: Session): Promise<Session> {
    return this.sessions.manager.transaction((manager) =>
      this.createWithinTransaction(manager, session),
    );
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

  private async insertWithNextOrder(
    manager: EntityManager,
    session: Session,
    performanceTableId: string,
  ): Promise<Session> {
    const rows = await insertSessionRow(manager, session, performanceTableId);
    return this.toEntity(requireFirstRow(rows, 'Failed to persist session.'));
  }

  private async createWithinTransaction(
    manager: EntityManager,
    session: Session,
  ): Promise<Session> {
    await manager.query(`SELECT id FROM problems WHERE id = $1 FOR UPDATE;`, [session.problemId]);
    const tableId = await this.findInitialTableId(manager, session.problemId);
    return this.insertWithNextOrder(manager, session, tableId);
  }

  private async findInitialTableId(manager: EntityManager, problemId: string): Promise<string> {
    const table = await findInitialTable(manager, problemId);
    if (!table?.id) {
      throw new UnprocessableEntityError(
        'Não há uma tabela de desempenho padrão disponível para iniciar a sessão.',
      );
    }
    if (table.isSessionCopy) return table.id;
    return (await createSessionPerformanceTableCopy(manager, table.id, table.roomId)).id;
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

async function insertSessionRow(
  manager: EntityManager,
  session: Session,
  performanceTableId: string,
): Promise<SessionRow[]> {
  return manager.query<SessionRow[]>(
    `INSERT INTO sessions (problem_id, performance_table_id, title, description, date, order_index, status)
     SELECT $1, $6, $2, $3, $4::date, COALESCE(MAX(order_index), 0) + 1, $5
       FROM sessions WHERE problem_id = $1
     RETURNING ${SESSION_COLUMNS};`,
    [
      session.problemId,
      session.title,
      session.description,
      session.date,
      session.status,
      performanceTableId,
    ],
  );
}

const FIND_INITIAL_TABLE_QUERY = `
  SELECT COALESCE(existing.id, default_table.id) AS id,
         COALESCE(existing.is_session_copy, default_table.is_session_copy, FALSE) AS "isSessionCopy",
         p.room_id AS "roomId"
    FROM problems p
    LEFT JOIN LATERAL (
      SELECT pt.id, pt.is_session_copy
        FROM sessions s
        JOIN performance_tables pt ON pt.id = s.performance_table_id
       WHERE s.problem_id = p.id AND pt.deleted_at IS NULL
       ORDER BY s.order_index LIMIT 1
    ) existing ON TRUE
    LEFT JOIN LATERAL (
      SELECT pt.id, pt.is_session_copy
        FROM rooms r
        JOIN performance_tables pt ON pt.tutor_id = r.tutor_id
       WHERE r.id = p.room_id AND pt.is_default = TRUE AND pt.deleted_at IS NULL
       LIMIT 1
    ) default_table ON TRUE
   WHERE p.id = $1;
`;

function findInitialTable(manager: EntityManager, problemId: string) {
  return manager
    .query<Array<{ id: string | null; isSessionCopy: boolean; roomId: string }>>(
      FIND_INITIAL_TABLE_QUERY,
      [problemId],
    )
    .then((rows) => rows[0] ?? null);
}
