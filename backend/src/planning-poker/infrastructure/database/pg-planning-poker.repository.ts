import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { firstRowOrNull, requireFirstRow } from '@/shared/database/rows';
import { violatedUniqueConstraint } from '@/shared/database/unique-violation';
import { ConflictError } from '@/shared/errors/application.error';
import {
  PlanningPoker,
  type PokerOrder,
  type PokerStatus,
} from '../../domain/entities/planning-poker';
import type {
  NewPlanningPoker,
  PlanningPokerRepository,
  PokerParticipant,
  PokerRoster,
} from '../../domain/repositories/planning-poker.repository';
import { returnedRows } from './returned-rows';

interface PlanningPokerRow {
  id: string;
  sessionId: string;
  anonymous: boolean;
  order: PokerOrder;
  status: PokerStatus;
  queue: string[];
  createdBy: string;
  createdAt: Date;
}

interface RosterRow extends PokerParticipant {
  isParticipant: boolean;
}

const POKER_COLUMNS = `
  id, session_id AS "sessionId", anonymous, order_mode AS "order", status,
  queue::text[] AS queue, created_by AS "createdBy", created_at AS "createdAt"`;

const ROSTER_SQL = `
  SELECT u.id AS "studentId", u.name, a.seat_number AS "seatNumber",
         EXISTS (SELECT 1 FROM user_photos p WHERE p.user_id = u.id) AS "hasPhoto",
         COALESCE(a.status IN ('PRESENT', 'LATE'), false) AS "isParticipant"
    FROM sessions s
    JOIN problems pr ON pr.id = s.problem_id
    JOIN room_students rs ON rs.room_id = pr.room_id
    JOIN users u ON u.id = rs.student_id
    LEFT JOIN attendances a ON a.session_id = s.id AND a.student_id = u.id
   WHERE s.id = $1 AND a.id IS NOT NULL
   ORDER BY a.seat_number NULLS LAST, u.name, u.id;`;

type IdResult = Array<{ id: string }> | [Array<{ id: string }>, number];

const toEntity = (row: PlanningPokerRow): PlanningPoker => new PlanningPoker(row);

const toParticipant = ({ studentId, name, seatNumber, hasPhoto }: RosterRow): PokerParticipant => ({
  studentId,
  name,
  seatNumber: seatNumber === null ? null : Number(seatNumber),
  hasPhoto,
});

@Injectable()
export class PgPlanningPokerRepository implements PlanningPokerRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  async findOpenBySession(sessionId: string): Promise<PlanningPoker | null> {
    const rows = await this.db.query<PlanningPokerRow[]>(
      `SELECT ${POKER_COLUMNS} FROM poker_sessions WHERE session_id = $1 AND status = 'OPEN';`,
      [sessionId],
    );
    const row = firstRowOrNull(rows);
    return row ? toEntity(row) : null;
  }

  async findRoster(sessionId: string): Promise<PokerRoster> {
    const rows = await this.db.query<RosterRow[]>(ROSTER_SQL, [sessionId]);
    return {
      participants: rows.filter((row) => row.isParticipant).map(toParticipant),
      absentees: rows.filter((row) => !row.isParticipant).map(toParticipant),
    };
  }

  async create(poker: NewPlanningPoker): Promise<PlanningPoker> {
    try {
      const rows = await this.db.query<PlanningPokerRow[]>(
        `INSERT INTO poker_sessions (session_id, anonymous, order_mode, queue, created_by)
         VALUES ($1, $2, $3, $4::uuid[], $5) RETURNING ${POKER_COLUMNS};`,
        [poker.sessionId, poker.anonymous, poker.order, poker.queue, poker.createdBy],
      );
      return toEntity(requireFirstRow(rows, 'Planning poker was not created.'));
    } catch (error) {
      if (violatedUniqueConstraint(error) === 'uq_poker_sessions_open') {
        throw new ConflictError('Já existe um planning poker aberto nesta sessão.');
      }
      throw error;
    }
  }

  async updateQueue(pokerId: string, queue: string[]): Promise<void> {
    await this.db.query(`UPDATE poker_sessions SET queue = $2::uuid[] WHERE id = $1;`, [
      pokerId,
      queue,
    ]);
  }

  async close(pokerId: string, closedBy: string): Promise<boolean> {
    const result = await this.db.query<IdResult>(
      `UPDATE poker_sessions SET status = 'CLOSED', closed_by = $2, closed_at = now()
        WHERE id = $1 AND status = 'OPEN' RETURNING id;`,
      [pokerId, closedBy],
    );
    return returnedRows(result).length > 0;
  }
}
