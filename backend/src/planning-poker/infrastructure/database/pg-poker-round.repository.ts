import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import { firstRowOrNull, requireFirstRow } from '@/shared/database/rows';
import { violatedUniqueConstraint } from '@/shared/database/unique-violation';
import { ConflictError, UnprocessableEntityError } from '@/shared/errors/application.error';
import {
  PokerRound,
  type PokerDecision,
  type PokerRoundStatus,
  type SeatAssignment,
} from '../../domain/entities/poker-round';
import type {
  NewPokerRound,
  PokerRoundRepository,
  PokerVote,
} from '../../domain/repositories/poker-round.repository';
import {
  CAST_VOTE_SQL,
  DECIDE_ROUND_SQL,
  DELETE_OPEN_ROUND_SQL,
  FIND_VOTES_SQL,
  INSERT_ROUND_SQL,
  RESTART_ROUND_SQL,
  REVEAL_ROUND_SQL,
  ROUND_COLUMNS,
  UPDATE_QUEUE_SQL,
} from './poker-round.sql';
import { returnedRows } from './returned-rows';

interface PokerRoundRow {
  id: string;
  pokerId: string;
  studentId: string;
  number: number;
  status: PokerRoundStatus;
  seats: SeatAssignment[];
  average: number | null;
  finalGrade: number | null;
  adjusted: boolean;
  justification: string | null;
  decidedBy: string | null;
  decidedAt: Date | null;
}

type IdResult = Array<{ id: string }> | [Array<{ id: string }>, number];

const toDecision = (row: PokerRoundRow): PokerDecision | null =>
  row.finalGrade === null || row.decidedBy === null || row.decidedAt === null
    ? null
    : {
        finalGrade: row.finalGrade,
        adjusted: row.adjusted,
        justification: row.justification,
        decidedBy: row.decidedBy,
        decidedAt: row.decidedAt,
      };

const toEntity = (row: PokerRoundRow): PokerRound =>
  new PokerRound({ ...row, number: Number(row.number), decision: toDecision(row) });

const ROUND_ERRORS: Record<string, () => Error> = {
  uq_poker_rounds_open: () => new ConflictError('Há uma rodada aberta ainda não decidida.'),
  uq_poker_rounds_student: () => new UnprocessableEntityError('O aluno já foi avaliado.'),
};

@Injectable()
export class PgPokerRoundRepository implements PokerRoundRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  findOpen(pokerId: string): Promise<PokerRound | null> {
    return this.findOne(`poker_id = $1 AND status <> 'DECIDED'`, [pokerId]);
  }

  findById(pokerId: string, roundId: string): Promise<PokerRound | null> {
    return this.findOne('poker_id = $1 AND id = $2', [pokerId, roundId]);
  }

  async findDecided(pokerId: string): Promise<PokerRound[]> {
    const rows = await this.db.query<PokerRoundRow[]>(
      `SELECT ${ROUND_COLUMNS} FROM poker_rounds
        WHERE poker_id = $1 AND status = 'DECIDED' ORDER BY decided_at, id;`,
      [pokerId],
    );
    return rows.map(toEntity);
  }

  findLast(pokerId: string): Promise<PokerRound | null> {
    return this.findOne('poker_id = $1 ORDER BY opened_at DESC, id DESC', [pokerId]);
  }

  async open(round: NewPokerRound, queue: string[]): Promise<PokerRound> {
    try {
      return await this.db.transaction(async (manager) => {
        const params = [round.pokerId, round.studentId, round.number, JSON.stringify(round.seats)];
        const rows = await manager.query<PokerRoundRow[]>(INSERT_ROUND_SQL, params);
        await manager.query(UPDATE_QUEUE_SQL, [round.pokerId, queue]);
        return toEntity(requireFirstRow(rows, 'Poker round was not created.'));
      });
    } catch (error) {
      const known = ROUND_ERRORS[violatedUniqueConstraint(error) ?? ''];
      throw known ? known() : error;
    }
  }

  cancel(round: PokerRound, queue: string[]): Promise<boolean> {
    return this.db.transaction(async (manager) => {
      if (!(await this.changed(manager, DELETE_OPEN_ROUND_SQL, [round.id]))) return false;
      await manager.query(UPDATE_QUEUE_SQL, [round.pokerId, queue]);
      return true;
    });
  }

  reveal(roundId: string, average: number | null): Promise<boolean> {
    return this.changed(this.db.manager, REVEAL_ROUND_SQL, [roundId, average]);
  }

  restart(roundId: string, seats: SeatAssignment[]): Promise<boolean> {
    return this.db.transaction(async (manager) => {
      const params = [roundId, JSON.stringify(seats)];
      if (!(await this.changed(manager, RESTART_ROUND_SQL, params))) return false;
      await manager.query('DELETE FROM poker_votes WHERE round_id = $1;', [roundId]);
      return true;
    });
  }

  decide(roundId: string, decision: PokerDecision): Promise<boolean> {
    const { finalGrade, adjusted, justification, decidedBy, decidedAt } = decision;
    const params = [roundId, finalGrade, adjusted, justification, decidedBy, decidedAt];
    return this.changed(this.db.manager, DECIDE_ROUND_SQL, params);
  }

  castVote(roundId: string, vote: PokerVote): Promise<boolean> {
    return this.changed(this.db.manager, CAST_VOTE_SQL, [roundId, vote.voterId, vote.score]);
  }

  findVotes(roundId: string): Promise<PokerVote[]> {
    return this.db.query<PokerVote[]>(FIND_VOTES_SQL, [roundId]);
  }

  private async findOne(condition: string, params: unknown[]): Promise<PokerRound | null> {
    const rows = await this.db.query<PokerRoundRow[]>(
      `SELECT ${ROUND_COLUMNS} FROM poker_rounds WHERE ${condition} LIMIT 1;`,
      params,
    );
    const row = firstRowOrNull(rows);
    return row ? toEntity(row) : null;
  }

  private async changed(manager: EntityManager, sql: string, params: unknown[]): Promise<boolean> {
    return returnedRows(await manager.query<IdResult>(sql, params)).length > 0;
  }
}
