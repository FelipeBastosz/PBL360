import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';
import { firstRowOrNull, requireFirstRow } from '@/shared/database/rows';
import { ProblemDelivery } from '../../domain/entities/problem-delivery.entity';
import type {
  ProblemDeliveryRepository,
  ProblemDeliverySummary,
} from '../../domain/repositories/problem-delivery.repository';

interface DeliverySummaryRow {
  id: string;
  url: string;
  authorId: string;
  authorName: string;
  submittedAt: Date;
}

const SUMMARY_COLUMNS = `
  d.id,
  d.url,
  u.id AS "authorId",
  u.name AS "authorName",
  d.created_at AS "submittedAt"`;

const LOCK_STUDENT_MEMBERSHIP_SQL = `
  SELECT room_id
  FROM room_students
  WHERE room_id = $1 AND student_id = $2
  FOR UPDATE;`;

const REPLACE_PREVIOUS_DELIVERY_SQL = `
  UPDATE problem_deliveries
  SET replaced_at = now()
  WHERE problem_id = $1 AND submitted_by = $2 AND replaced_at IS NULL;`;

const INSERT_DELIVERY_SQL = `
  WITH inserted AS (
    INSERT INTO problem_deliveries (room_id, problem_id, submitted_by, url)
    VALUES ($1, $2, $3, $4)
    RETURNING id, url, submitted_by, created_at
  )
  SELECT ${SUMMARY_COLUMNS}
  FROM inserted d
  JOIN users u ON u.id = d.submitted_by;`;

const LIST_ACTIVE_BY_PROBLEM_SQL = `
  SELECT ${SUMMARY_COLUMNS}
  FROM problem_deliveries d
  JOIN users u ON u.id = d.submitted_by
  WHERE d.problem_id = $1 AND d.replaced_at IS NULL
  ORDER BY d.created_at DESC, d.id DESC;`;

const FIND_ACTIVE_BY_PROBLEM_AND_STUDENT_SQL = `
  SELECT ${SUMMARY_COLUMNS}
  FROM problem_deliveries d
  JOIN users u ON u.id = d.submitted_by
  WHERE d.problem_id = $1 AND d.submitted_by = $2 AND d.replaced_at IS NULL
  LIMIT 1;`;

const toSummary = (row: DeliverySummaryRow): ProblemDeliverySummary => ({
  id: row.id,
  url: row.url,
  submittedBy: { id: row.authorId, name: row.authorName },
  submittedAt: row.submittedAt,
});

@Injectable()
export class PgProblemDeliveryRepository implements ProblemDeliveryRepository {
  constructor(
    @InjectRepository(ProblemDelivery)
    private readonly deliveries: Repository<ProblemDelivery>,
  ) {}

  registerForStudent(delivery: ProblemDelivery): Promise<ProblemDeliverySummary> {
    return this.deliveries.manager.transaction(async (manager) => {
      await this.lockStudentMembership(manager, delivery.roomId, delivery.submittedBy);
      await this.replacePreviousDelivery(manager, delivery.problemId, delivery.submittedBy);
      return this.insertDelivery(manager, delivery);
    });
  }

  async listActiveByProblem(problemId: string): Promise<ProblemDeliverySummary[]> {
    const rows = await this.deliveries.query<DeliverySummaryRow[]>(LIST_ACTIVE_BY_PROBLEM_SQL, [
      problemId,
    ]);
    return rows.map(toSummary);
  }

  async findActiveByProblemAndStudent(
    problemId: string,
    studentId: string,
  ): Promise<ProblemDeliverySummary | null> {
    const rows = await this.deliveries.query<DeliverySummaryRow[]>(
      FIND_ACTIVE_BY_PROBLEM_AND_STUDENT_SQL,
      [problemId, studentId],
    );
    const row = firstRowOrNull(rows);
    return row ? toSummary(row) : null;
  }

  private async lockStudentMembership(
    manager: EntityManager,
    roomId: string,
    studentId: string,
  ): Promise<void> {
    await manager.query(LOCK_STUDENT_MEMBERSHIP_SQL, [roomId, studentId]);
  }

  private async replacePreviousDelivery(
    manager: EntityManager,
    problemId: string,
    studentId: string,
  ): Promise<void> {
    await manager.query(REPLACE_PREVIOUS_DELIVERY_SQL, [problemId, studentId]);
  }

  private async insertDelivery(
    manager: EntityManager,
    delivery: ProblemDelivery,
  ): Promise<ProblemDeliverySummary> {
    const rows = await manager.query<DeliverySummaryRow[]>(INSERT_DELIVERY_SQL, [
      delivery.roomId,
      delivery.problemId,
      delivery.submittedBy,
      delivery.url,
    ]);
    return toSummary(requireFirstRow(rows, 'Failed to persist problem delivery.'));
  }
}
