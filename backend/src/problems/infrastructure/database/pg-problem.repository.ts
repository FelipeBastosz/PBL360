import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';

import { firstRowOrNull, requireFirstRow } from '@/shared/database/rows';
import { ConflictError } from '@/shared/errors/application.error';

import { updateProblemDetails } from './problem-update.persistence';

import { Problem } from '../../domain/entities/problem.entity';
import type {
  ProblemRepository,
  UpdateProblemDetails,
} from '../../domain/repositories/problem.repository';

interface ProblemRow {
  id: string;
  roomId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  startDate: string | null;
  endDate: string | null;
  selfEvalReleased: boolean;
  peerEvalReleased: boolean;
  releasedAt: Date | null;
  selfEvalDeadline: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
}

const PROBLEM_COLUMNS = `
  id,
  room_id AS "roomId",
  title,
  description,
  order_index AS "orderIndex",
  to_char(start_date, 'YYYY-MM-DD') AS "startDate",
  to_char(end_date, 'YYYY-MM-DD') AS "endDate",
  self_eval_released AS "selfEvalReleased",
  peer_eval_released AS "peerEvalReleased",
  released_at AS "releasedAt",
  self_eval_deadline AS "selfEvalDeadline",
  created_by AS "createdBy",
  created_at AS "createdAt",
  updated_at AS "updatedAt",
  updated_by AS "updatedBy"`;

@Injectable()
export class PgProblemRepository implements ProblemRepository {
  constructor(
    @InjectRepository(Problem)
    private readonly problems: Repository<Problem>,
  ) {}

  async findById(id: string): Promise<Problem | null> {
    const rows = await this.problems.query<ProblemRow[]>(
      `SELECT ${PROBLEM_COLUMNS}
        FROM problems
        WHERE id = $1
        LIMIT 1;`,
      [id],
    );

    const row = firstRowOrNull(rows);

    return row ? this.toEntity(row) : null;
  }

  async findByRoomId(roomId: string): Promise<Problem[]> {
    const rows = await this.problems.query<ProblemRow[]>(
      `SELECT ${PROBLEM_COLUMNS}
        FROM problems
        WHERE room_id = $1
        ORDER BY order_index ASC, created_at ASC;`,
      [roomId],
    );

    return rows.map((row) => this.toEntity(row));
  }

  async hasSessions(problemId: string): Promise<boolean> {
    const rows = await this.problems.query<Array<{ exists: boolean }>>(
      `SELECT EXISTS (SELECT 1 FROM sessions WHERE problem_id = $1) AS exists;`,
      [problemId],
    );
    return firstRowOrNull(rows)?.exists ?? false;
  }

  async countSessions(problemId: string): Promise<number> {
    const rows = await this.problems.query<Array<{ count: string }>>(
      `SELECT COUNT(*)::int AS count FROM sessions WHERE problem_id = $1;`,
      [problemId],
    );
    return Number(firstRowOrNull(rows)?.count ?? 0);
  }

  updateDetails(input: UpdateProblemDetails): Promise<Problem> {
    return this.problems.manager.transaction(async (manager) => {
      await updateProblemDetails(manager, input);
      const rows = await manager.query<ProblemRow[]>(
        `SELECT ${PROBLEM_COLUMNS} FROM problems WHERE id = $1;`,
        [input.id],
      );
      return this.toEntity(requireFirstRow(rows, 'Failed to update problem.'));
    });
  }

  create(problem: Problem): Promise<Problem> {
    return this.problems.manager.transaction(async (manager): Promise<Problem> => {
      await manager.query(`SELECT id FROM rooms WHERE id = $1 FOR UPDATE;`, [problem.roomId]);

      return this.insertWithNextOrder(manager, problem);
    });
  }

  async delete(id: string, roomId: string): Promise<void> {
    await this.problems.manager.transaction(async (manager): Promise<void> => {
      await manager.query(`SELECT id FROM rooms WHERE id = $1 FOR UPDATE;`, [roomId]);
      const targetRows = await manager.query<Array<{ orderIndex: number }>>(
        `SELECT order_index AS "orderIndex" FROM problems WHERE id = $1 AND room_id = $2 FOR UPDATE;`,
        [id, roomId],
      );

      const target = firstRowOrNull(targetRows);
      if (!target) {
        return;
      }

      if (await this.hasSessionsInTransaction(manager, id)) {
        throw new ConflictError('O problema possui sessões e não pode ser excluído.');
      }

      const orderIndex = Number(target.orderIndex);

      await manager.query(`DELETE FROM problems WHERE id = $1 AND room_id = $2;`, [id, roomId]);
      await this.decrementFollowingOrders(manager, roomId, orderIndex);
    });
  }

  private async hasSessionsInTransaction(
    manager: EntityManager,
    problemId: string,
  ): Promise<boolean> {
    const rows = await manager.query<Array<{ exists: boolean }>>(
      `SELECT EXISTS (SELECT 1 FROM sessions WHERE problem_id = $1) AS exists;`,
      [problemId],
    );
    return firstRowOrNull(rows)?.exists ?? false;
  }

  private async decrementFollowingOrders(
    manager: EntityManager,
    roomId: string,
    orderIndex: number,
  ): Promise<void> {
    await manager.query(
      `UPDATE problems
       SET order_index = order_index - 1
       WHERE room_id = $1 AND order_index > $2;`,
      [roomId, orderIndex],
    );
  }

  private async insertWithNextOrder(manager: EntityManager, problem: Problem): Promise<Problem> {
    const rows = await manager.query<ProblemRow[]>(
      `INSERT INTO problems (
          room_id, title, description, order_index, start_date, end_date,
          self_eval_released, peer_eval_released, released_at, self_eval_deadline,
          created_by
        )
        SELECT $1, $2, $3, COALESCE(MAX(order_index), 0) + 1, $4::date, $5::date,
               $6, $7, $8, $9, $10
        FROM problems
        WHERE room_id = $1
        RETURNING ${PROBLEM_COLUMNS};`,
      this.insertValues(problem),
    );

    return this.toEntity(requireFirstRow(rows, 'Failed to persist problem.'));
  }

  private insertValues(problem: Problem): unknown[] {
    return [
      problem.roomId,
      problem.title,
      problem.description ?? null,
      problem.startDate ?? null,
      problem.endDate ?? null,
      problem.selfEvalReleased,
      problem.peerEvalReleased,
      problem.releasedAt ?? null,
      problem.selfEvalDeadline ?? null,
      problem.createdBy,
    ];
  }

  private toEntity(row: ProblemRow): Problem {
    return Object.assign(new Problem(), row, { orderIndex: Number(row.orderIndex) });
  }
}
