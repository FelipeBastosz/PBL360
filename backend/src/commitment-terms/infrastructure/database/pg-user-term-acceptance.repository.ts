import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstRowOrNull } from '@/shared/database/rows';
import { UserTermAcceptance } from '../../domain/entities/user-term-acceptance.entity';
import type { UserTermAcceptanceRepository } from '../../domain/repositories/user-term-acceptance.repository';

interface UserTermAcceptanceRow {
  id: string;
  userId: string;
  termId: string;
  termVersion: string;
  acceptedAt: Date;
}

const ACCEPTANCE_COLUMNS = `
  id,
  user_id AS "userId",
  term_id AS "termId",
  term_version AS "termVersion",
  accepted_at AS "acceptedAt"
`;

const toEntity = (row: UserTermAcceptanceRow): UserTermAcceptance =>
  Object.assign(new UserTermAcceptance(), row);

@Injectable()
export class PgUserTermAcceptanceRepository implements UserTermAcceptanceRepository {
  constructor(
    @InjectRepository(UserTermAcceptance)
    private readonly repository: Repository<UserTermAcceptance>,
  ) {}

  async findByUserId(userId: string): Promise<UserTermAcceptance | null> {
    const rows = await this.repository.query<UserTermAcceptanceRow[]>(
      `SELECT ${ACCEPTANCE_COLUMNS}
       FROM user_term_acceptances
       WHERE user_id = $1
       LIMIT 1;`,
      [userId],
    );
    const row = firstRowOrNull(rows);
    return row ? toEntity(row) : null;
  }

  async hasAccepted(userId: string): Promise<boolean> {
    const rows = await this.repository.query<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1
         FROM user_term_acceptances
         WHERE user_id = $1
       ) AS "exists";`,
      [userId],
    );
    return rows[0]?.exists ?? false;
  }

  async create(acceptance: UserTermAcceptance): Promise<UserTermAcceptance> {
    const rows = await this.repository.query<UserTermAcceptanceRow[]>(
      `INSERT INTO user_term_acceptances (user_id, term_id, term_version, accepted_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING ${ACCEPTANCE_COLUMNS};`,
      [acceptance.userId, acceptance.termId, acceptance.termVersion, acceptance.acceptedAt],
    );
    const row = firstRowOrNull(rows);
    if (row) {
      return toEntity(row);
    }
    const existing = await this.findByUserId(acceptance.userId);
    if (!existing) {
      throw new Error('Falha ao registrar aceite do termo de compromisso.');
    }
    return existing;
  }
}
