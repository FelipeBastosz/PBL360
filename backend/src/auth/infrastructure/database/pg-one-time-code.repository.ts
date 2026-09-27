import type { EntityManager, Repository } from 'typeorm';
import type { OneTimeCode } from '../../domain/entities/one-time-code';
import { MAX_CODE_ATTEMPTS } from '../../domain/entities/one-time-code';
import type {
  IssueHistory,
  OneTimeCodeRepository,
} from '../../domain/repositories/one-time-code.repository';

interface OneTimeCodeRow {
  id: string;
  userId: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt: Date | null;
  attempts: number;
}

const CODE_COLUMNS = `
  id,
  user_id AS "userId",
  email,
  code_hash AS "codeHash",
  expires_at AS "expiresAt",
  created_at AS "createdAt",
  used_at AS "usedAt",
  attempts`;

export abstract class PgOneTimeCodeRepository<
  T extends OneTimeCode,
> implements OneTimeCodeRepository<T> {
  protected constructor(
    private readonly repository: Repository<T>,
    private readonly table: string,
  ) {}

  replacePendingFor(code: T): Promise<void> {
    return this.repository.manager.transaction(async (manager: EntityManager) => {
      await manager.query(
        `UPDATE ${this.table} SET used_at = now() WHERE user_id = $1 AND used_at IS NULL;`,
        [code.userId],
      );
      await manager.query(
        `INSERT INTO ${this.table} (id, user_id, email, code_hash, expires_at, created_at, attempts)
          VALUES ($1, $2, $3, $4, $5, $6, 0);`,
        [code.id, code.userId, code.email, code.codeHash, code.expiresAt, code.createdAt],
      );
    });
  }

  async findPendingByUserId(userId: string): Promise<T | null> {
    const rows = await this.repository.query<OneTimeCodeRow[]>(
      `SELECT ${CODE_COLUMNS}
        FROM ${this.table}
        WHERE user_id = $1
          AND used_at IS NULL
          AND expires_at > now()
        ORDER BY created_at DESC
        LIMIT 1;`,
      [userId],
    );

    return rows.length > 0 ? this.repository.create(rows[0] as unknown as T) : null;
  }

  async consumeAttempt(id: string): Promise<boolean> {
    const [rows] = await this.repository.query<[unknown[], number]>(
      `UPDATE ${this.table}
        SET attempts = attempts + 1
        WHERE id = $1
          AND used_at IS NULL
          AND expires_at > now()
          AND attempts < $2
        RETURNING id;`,
      [id, MAX_CODE_ATTEMPTS],
    );

    return rows.length > 0;
  }

  async markAsUsed(id: string): Promise<boolean> {
    const [rows] = await this.repository.query<[unknown[], number]>(
      `UPDATE ${this.table}
        SET used_at = now()
        WHERE id = $1
          AND used_at IS NULL
        RETURNING id;`,
      [id],
    );

    return rows.length > 0;
  }

  async issueHistoryFor(userId: string): Promise<IssueHistory> {
    const [row] = await this.repository.query<[IssueHistory]>(
      `SELECT MAX(created_at) AS "lastIssuedAt",
          (COUNT(*) FILTER (WHERE created_at > now() - interval '1 hour'))::int AS "issuedInLastHour"
        FROM ${this.table}
        WHERE user_id = $1;`,
      [userId],
    );

    return row;
  }
}
