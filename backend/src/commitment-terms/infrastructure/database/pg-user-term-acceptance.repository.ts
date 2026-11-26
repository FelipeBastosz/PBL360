import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type EntityManager } from 'typeorm';
import { firstRowOrNull } from '@/shared/database/rows';
import { ConflictError } from '@/shared/errors/application.error';
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

const INSERT_ACCEPTANCE_QUERY = `
  INSERT INTO user_term_acceptances (user_id, term_id, term_version, accepted_at)
  VALUES ($1, $2, $3, now())
  ON CONFLICT (user_id, term_id) DO NOTHING
  RETURNING ${ACCEPTANCE_COLUMNS};
`;
const LOCK_CURRENT_TERM_QUERY = `
  SELECT id
  FROM commitment_terms
  WHERE id = $1 AND version = $2 AND is_current = TRUE
  FOR SHARE;
`;
const FIND_ACCEPTANCE_BY_TERM_QUERY = `
  SELECT ${ACCEPTANCE_COLUMNS}
  FROM user_term_acceptances
  WHERE user_id = $1 AND term_id = $2
  LIMIT 1;
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
       ORDER BY accepted_at DESC, id DESC
       LIMIT 1;`,
      [userId],
    );
    const row = firstRowOrNull(rows);
    return row ? toEntity(row) : null;
  }

  async findByUserIdAndTermId(userId: string, termId: string): Promise<UserTermAcceptance | null> {
    const rows = await this.repository.query<UserTermAcceptanceRow[]>(
      `SELECT ${ACCEPTANCE_COLUMNS}
       FROM user_term_acceptances
       WHERE user_id = $1 AND term_id = $2
       LIMIT 1;`,
      [userId, termId],
    );
    const row = firstRowOrNull(rows);
    return row ? toEntity(row) : null;
  }

  async hasAccepted(userId: string): Promise<boolean> {
    const rows = await this.repository.query<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1
         FROM user_term_acceptances AS acceptance
         JOIN commitment_terms AS term ON term.id = acceptance.term_id
         WHERE acceptance.user_id = $1
           AND term.is_current = TRUE
           AND acceptance.term_version = term.version
       ) AS "exists";`,
      [userId],
    );
    return rows[0]?.exists ?? false;
  }

  async create(acceptance: UserTermAcceptance): Promise<UserTermAcceptance> {
    return this.repository.manager.transaction((manager) =>
      this.insertAcceptance(manager, acceptance),
    );
  }

  private async insertAcceptance(
    manager: EntityManager,
    acceptance: UserTermAcceptance,
  ): Promise<UserTermAcceptance> {
    await this.assertCurrentTerm(manager, acceptance);
    const rows = await manager.query<UserTermAcceptanceRow[]>(INSERT_ACCEPTANCE_QUERY, [
      acceptance.userId,
      acceptance.termId,
      acceptance.termVersion,
    ]);
    const row = firstRowOrNull(rows);
    if (row) {
      return toEntity(row);
    }

    return this.findExistingAcceptance(manager, acceptance);
  }

  private async findExistingAcceptance(
    manager: EntityManager,
    acceptance: UserTermAcceptance,
  ): Promise<UserTermAcceptance> {
    const existingRows = await manager.query<UserTermAcceptanceRow[]>(
      FIND_ACCEPTANCE_BY_TERM_QUERY,
      [acceptance.userId, acceptance.termId],
    );
    const existing = firstRowOrNull(existingRows);
    if (!existing) {
      throw new Error('Falha ao registrar aceite do termo de compromisso.');
    }
    return toEntity(existing);
  }

  private async assertCurrentTerm(
    manager: EntityManager,
    acceptance: UserTermAcceptance,
  ): Promise<void> {
    const rows = await manager.query<{ id: string }[]>(LOCK_CURRENT_TERM_QUERY, [
      acceptance.termId,
      acceptance.termVersion,
    ]);
    if (rows.length === 0) {
      throw new ConflictError('A versão enviada não corresponde mais ao termo vigente.');
    }
  }
}
