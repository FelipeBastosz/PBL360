import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';

import { Problem } from '../../domain/entities/problem.entity';
import type { ProblemRepository } from '../../domain/repositories/problem.repository';

interface ProblemRow {
  id: string;
  roomId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  startDate: string | Date | null;
  endDate: string | Date | null;
  selfEvalReleased: boolean;
  peerEvalReleased: boolean;
  releasedAt: string | Date | null;
  selfEvalDeadline: string | Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const PROBLEM_COLUMNS = `
  id,
  room_id AS "roomId",
  title,
  description,
  order_index AS "orderIndex",
  start_date AS "startDate",
  end_date AS "endDate",
  self_eval_released AS "selfEvalReleased",
  peer_eval_released AS "peerEvalReleased",
  released_at AS "releasedAt",
  self_eval_deadline AS "selfEvalDeadline",
  created_by AS "createdBy",
  created_at AS "createdAt",
  updated_at AS "updatedAt"`;

@Injectable()
export class PgProblemRepository implements ProblemRepository {
  constructor(
    @InjectRepository(Problem)
    private readonly problems: Repository<Problem>,
  ) {}

  async findById(id: string): Promise<Problem | null> {
    return this.queryOne(
      `SELECT ${PROBLEM_COLUMNS}
       FROM problems
       WHERE id = $1
       LIMIT 1;`,
      [id],
    );
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

  async countByRoomId(roomId: string): Promise<number> {
    const rows = await this.problems.query<{ count: string | number }[]>(
      `SELECT COUNT(*)::int AS count
       FROM problems
       WHERE room_id = $1;`,
      [roomId],
    );

    return Number(rows[0]?.count ?? 0);
  }

  async getNextOrderIndex(roomId: string): Promise<number> {
    const rows = await this.problems.query<{ nextOrder: string | number }[]>(
      `SELECT (COALESCE(MAX(order_index), 0) + 1)::int AS "nextOrder"
       FROM problems
       WHERE room_id = $1;`,
      [roomId],
    );

    return Number(rows[0]?.nextOrder ?? 1);
  }

  async save(problem: Problem): Promise<Problem> {
    if (problem.id) {
      return this.updateExisting(problem);
    }

    return this.problems.manager.transaction(async (manager): Promise<Problem> => {
      await manager.query(`SELECT id FROM rooms WHERE id = $1 FOR UPDATE;`, [problem.roomId]);
      const orderIndex = await this.resolveOrderIndex(manager, problem.roomId, problem.orderIndex);

      return this.insertProblem(manager, problem, orderIndex);
    });
  }

  private async resolveOrderIndex(
    manager: EntityManager,
    roomId: string,
    existingOrder?: number,
  ): Promise<number> {
    if (existingOrder && existingOrder >= 1) {
      return existingOrder;
    }

    const rows = await manager.query<{ nextOrder: string | number }[]>(
      `SELECT (COALESCE(MAX(order_index), 0) + 1)::int AS "nextOrder"
       FROM problems
       WHERE room_id = $1;`,
      [roomId],
    );

    return Number(rows[0]?.nextOrder ?? 1);
  }

  private async insertProblem(
    manager: EntityManager,
    problem: Problem,
    orderIndex: number,
  ): Promise<Problem> {
    const rows = await manager.query<ProblemRow[]>(
      `INSERT INTO problems (
         room_id, title, description, order_index, start_date, end_date,
         self_eval_released, peer_eval_released, released_at, self_eval_deadline, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING ${PROBLEM_COLUMNS};`,
      this.insertValues(problem, orderIndex),
    );

    if (rows.length === 0) {
      throw new Error('Falha ao persistir problema no banco de dados.');
    }

    return this.toEntity(rows[0]);
  }

  private insertValues(problem: Problem, orderIndex: number): unknown[] {
    return [
      problem.roomId,
      problem.title,
      problem.description ?? null,
      orderIndex,
      problem.startDate ?? null,
      problem.endDate ?? null,
      problem.selfEvalReleased ?? false,
      problem.peerEvalReleased ?? false,
      problem.releasedAt ?? null,
      problem.selfEvalDeadline ?? null,
      problem.createdBy,
    ];
  }

  private updateValues(problem: Problem): unknown[] {
    return [
      problem.title,
      problem.description ?? null,
      problem.orderIndex,
      problem.startDate ?? null,
      problem.endDate ?? null,
      problem.selfEvalReleased ?? false,
      problem.peerEvalReleased ?? false,
      problem.releasedAt ?? null,
      problem.selfEvalDeadline ?? null,
      problem.id,
    ];
  }

  private async updateExisting(problem: Problem): Promise<Problem> {
    const rows = await this.problems.query<ProblemRow[]>(
      `UPDATE problems
       SET title = $1, description = $2, order_index = $3, start_date = $4,
           end_date = $5, self_eval_released = $6, peer_eval_released = $7,
           released_at = $8, self_eval_deadline = $9, updated_at = now()
       WHERE id = $10
       RETURNING ${PROBLEM_COLUMNS};`,
      this.updateValues(problem),
    );

    if (rows.length === 0) {
      throw new Error(`Problema com ID ${problem.id} não encontrado.`);
    }

    return this.toEntity(rows[0]);
  }

  private async queryOne(sql: string, params: unknown[]): Promise<Problem | null> {
    const rows = await this.problems.query<ProblemRow[]>(sql, params);

    if (rows.length === 0) {
      return null;
    }

    return this.toEntity(rows[0]);
  }

  private toEntity(row: ProblemRow): Problem {
    const problem = new Problem();
    problem.id = row.id;
    problem.roomId = row.roomId;
    problem.title = row.title;
    problem.description = row.description;
    problem.orderIndex = Number(row.orderIndex);
    problem.startDate = row.startDate ? new Date(row.startDate) : null;
    problem.endDate = row.endDate ? new Date(row.endDate) : null;
    problem.selfEvalReleased = Boolean(row.selfEvalReleased);
    problem.peerEvalReleased = Boolean(row.peerEvalReleased);
    problem.releasedAt = row.releasedAt ? new Date(row.releasedAt) : null;
    problem.selfEvalDeadline = row.selfEvalDeadline ? new Date(row.selfEvalDeadline) : null;
    problem.createdBy = row.createdBy;
    problem.createdAt = new Date(row.createdAt);
    problem.updatedAt = new Date(row.updatedAt);

    return problem;
  }
}
