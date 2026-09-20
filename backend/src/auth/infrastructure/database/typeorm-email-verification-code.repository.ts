import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailVerificationCode } from '../../domain/entities/email-verification-code.entity';
import type { EmailVerificationCodeRepository } from '../../domain/repositories/email-verification-code.repository';

interface EmailVerificationCodeRaw {
  id: string;
  userId: string;
  email: string;
  code: string;
  expiresAt: string | Date;
  createdAt: string | Date;
  usedAt: string | Date | null;
}

const CODE_COLUMNS = `
    id,
    user_id AS "userId",
    email,
    code,
    expires_at AS "expiresAt",
    created_at AS "createdAt",
    used_at AS "usedAt"`;

@Injectable()
export class TypeOrmEmailVerificationCodeRepository implements EmailVerificationCodeRepository {
  constructor(
    @InjectRepository(EmailVerificationCode)
    private readonly repository: Repository<EmailVerificationCode>,
  ) {}

  async save(code: EmailVerificationCode): Promise<void> {
    await this.repository.query(
      `
      INSERT INTO email_verification_codes (id, user_id, email, code, expires_at, created_at, used_at)
      VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        expires_at = EXCLUDED.expires_at,
        used_at = EXCLUDED.used_at;
      `,
      this.writableValues(code),
    );
  }

  async findPendingByUserId(userId: string): Promise<EmailVerificationCode | null> {
    const rows = await this.repository.query<EmailVerificationCodeRaw[]>(
      `
      SELECT ${CODE_COLUMNS}
      FROM email_verification_codes
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
      UPDATE email_verification_codes
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
      UPDATE email_verification_codes
      SET used_at = $1
      WHERE id = $2;
      `,
      [new Date(), id],
    );
  }

  private writableValues(code: EmailVerificationCode): unknown[] {
    return [
      code.id ?? null,
      code.userId,
      code.email,
      code.code,
      code.expiresAt,
      code.createdAt,
      code.usedAt ?? null,
    ];
  }

  private mapToEntity(raw: EmailVerificationCodeRaw): EmailVerificationCode {
    const entity = new EmailVerificationCode();
    entity.id = raw.id;
    entity.userId = raw.userId;
    entity.email = raw.email;
    entity.code = raw.code;
    entity.expiresAt = new Date(raw.expiresAt);
    entity.createdAt = new Date(raw.createdAt);
    entity.usedAt = raw.usedAt ? new Date(raw.usedAt) : null;

    return entity;
  }
}
