import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type EntityManager } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { firstRowOrNull, requireFirstRow } from '@/shared/database/rows';
import { violatedUniqueConstraint } from '@/shared/database/unique-violation';
import { ConflictError } from '@/shared/errors/application.error';
import type { UserType } from '../../domain/enums/user-type.enum';
import type { UserRepository, TutorSummary } from '../../domain/repositories/user.repository';

interface UserRow {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  registrationNumber: string | null;
  hasPhoto: boolean;
  type: UserType;
  active: boolean;
  tokenVersion: number;
  createdAt: Date;
}

const CONFLICT_MESSAGES: Record<string, string> = {
  uq_users_email: 'Já existe uma conta cadastrada com este e-mail.',
  uq_users_registration_number: 'Já existe uma conta cadastrada com esta matrícula.',
};

const USER_COLUMNS = `
    id,
    name,
    email,
    password_hash AS "passwordHash",
    registration_number AS "registrationNumber",
    EXISTS (SELECT 1 FROM user_photos WHERE user_photos.user_id = users.id) AS "hasPhoto",
    type,
    active,
    token_version AS "tokenVersion",
    created_at AS "createdAt"`;

const WRITABLE_COLUMNS = `name, email, password_hash, registration_number, type, active, token_version`;

@Injectable()
export class PgUserRepository implements UserRepository {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  searchTutors(query: string): Promise<TutorSummary[]> {
    return this.users.query<TutorSummary[]>(
      `SELECT id, name, email
        FROM users
        WHERE type = 'TUTOR'
          AND POSITION(LOWER($1) IN LOWER(email)) > 0
        ORDER BY name ASC, id ASC
        LIMIT 20;`,
      [query],
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.queryOne(
      `SELECT ${USER_COLUMNS}
        FROM users
        WHERE email = $1
        LIMIT 1;`,
      [email],
    );
  }

  async findById(id: string): Promise<User | null> {
    return this.queryOne(
      `SELECT ${USER_COLUMNS}
        FROM users
        WHERE id = $1
        LIMIT 1;`,
      [id],
    );
  }

  async save(user: User): Promise<User> {
    try {
      return await this.users.manager.transaction(async (manager) => {
        const saved = await (user.id
          ? this.updateExisting(manager, user)
          : this.insertNew(manager, user));

        return this.savePendingPhoto(manager, user, saved);
      });
    } catch (error) {
      throw this.translateConflict(error);
    }
  }

  private translateConflict(error: unknown): unknown {
    const constraint = violatedUniqueConstraint(error);
    const message = constraint === null ? undefined : CONFLICT_MESSAGES[constraint];

    return message ? new ConflictError(message) : error;
  }

  private async insertNew(manager: EntityManager, user: User): Promise<User> {
    const rows = await manager.query<UserRow[]>(
      `INSERT INTO users (${WRITABLE_COLUMNS})
        VALUES ($1, $2, $3, $4, $5, COALESCE($6, FALSE), COALESCE($7, 0))
        RETURNING ${USER_COLUMNS};`,
      this.writableValues(user),
    );

    return this.toEntity(requireFirstRow(rows, 'Failed to persist user in database.'));
  }

  private async updateExisting(manager: EntityManager, user: User): Promise<User> {
    const [rows] = await manager.query<[UserRow[], number]>(
      `UPDATE users
        SET name = $2, email = $3, password_hash = $4, registration_number = $5,
            type = $6, active = COALESCE($7, active),
            token_version = COALESCE($8, token_version)
        WHERE id = $1
        RETURNING ${USER_COLUMNS};`,
      [user.id, ...this.writableValues(user)],
    );

    return this.toEntity(requireFirstRow(rows, `User ${user.id} not found.`));
  }

  private async savePendingPhoto(manager: EntityManager, user: User, saved: User): Promise<User> {
    const photo = user.pendingPhoto;

    if (!photo) {
      return saved;
    }

    await manager.query(
      `INSERT INTO user_photos (user_id, content, mime_type)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE
          SET content = EXCLUDED.content, mime_type = EXCLUDED.mime_type, updated_at = now();`,
      [saved.id, photo.content, photo.mimeType],
    );
    saved.hasPhoto = true;

    return saved;
  }

  private toEntity(row: UserRow): User {
    return Object.assign(this.users.create(row), { hasPhoto: row.hasPhoto });
  }

  private writableValues(user: User): unknown[] {
    return [
      user.name,
      user.email,
      user.passwordHash,
      user.registrationNumber,
      user.type,
      user.active,
      user.tokenVersion,
    ];
  }

  private async queryOne(sql: string, params: unknown[]): Promise<User | null> {
    const rows = await this.users.query<UserRow[]>(sql, params);
    const row = firstRowOrNull(rows);
    return row ? this.toEntity(row) : null;
  }
}
