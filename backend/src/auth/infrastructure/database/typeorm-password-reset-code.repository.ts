import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordResetCode } from '../../domain/entities/password-reset-code.entity';
import type { PasswordResetCodeRepository } from '../../domain/repositories/password-reset-code.repository';

interface PasswordResetCodeRaw {
  id: string;
  userId: string;
  email: string;
  code: string;
  expiresAt: string | Date;
  createdAt: string | Date;
  usedAt: string | Date | null;
  attempts: number;
}

const CODE_COLUMNS = `
    id,
    user_id AS "userId",
    email,
    code,
    expires_at AS "expiresAt",
    created_at AS "createdAt",
    used_at AS "usedAt",
    attempts`;

@Injectable()
export class TypeOrmPasswordResetCodeRepository implements PasswordResetCodeRepository {
  constructor(
    @InjectRepository(PasswordResetCode)
    private readonly repository: Repository<PasswordResetCode>,
  ) {}

  async save(code: PasswordResetCode): Promise<void> {
    await this.repository.query(
      `
      INSERT INTO password_reset_codes (id, user_id, email, code, expires_at, created_at, used_at, attempts)
      VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        expires_at = EXCLUDED.expires_at,
        used_at = EXCLUDED.used_at,
        attempts = EXCLUDED.attempts;
      `,
      this.writableValues(code),
    );
  }

  async findPendingByUserId(userId: string): Promise<PasswordResetCode | null> {
    const rows = await this.repository.query<PasswordResetCodeRaw[]>(
      `
      SELECT ${CODE_COLUMNS}
      FROM password_reset_codes
      WHERE user_id = $1
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1;
      `,
      [userId],
    );

    return rows.length > 0 ? this.mapToEntity(rows[0]) : null;
  }

  async invalidatePendingFor(userId: string): Promise<void> {
    await this.repository.query(
      `
      UPDATE password_reset_codes
      SET used_at = $1
      WHERE user_id = $2
        AND used_at IS NULL;
      `,
      [new Date(), userId],
    );
  }

  async markAsUsed(id: string): Promise<void> {
    await this.repository.query(
      `
      UPDATE password_reset_codes
      SET used_at = $1
      WHERE id = $2;
      `,
      [new Date(), id],
    );
  }

  async registerFailedAttempt(id: string): Promise<void> {
    await this.repository.query(
      `
      UPDATE password_reset_codes
      SET attempts = attempts + 1
      WHERE id = $1;
      `,
      [id],
    );
  }

  private writableValues(code: PasswordResetCode): unknown[] {
    return [
      code.id ?? null,
      code.userId,
      code.email,
      code.code,
      code.expiresAt,
      code.createdAt,
      code.usedAt ?? null,
      code.attempts,
    ];
  }

  private mapToEntity(raw: PasswordResetCodeRaw): PasswordResetCode {
    const entity = new PasswordResetCode();
    entity.id = raw.id;
    entity.userId = raw.userId;
    entity.email = raw.email;
    entity.code = raw.code;
    entity.expiresAt = new Date(raw.expiresAt);
    entity.createdAt = new Date(raw.createdAt);
    entity.usedAt = raw.usedAt ? new Date(raw.usedAt) : null;
    entity.attempts = raw.attempts;

    return entity;
  }
}
