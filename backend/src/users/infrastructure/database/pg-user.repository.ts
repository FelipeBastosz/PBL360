import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { violatedUniqueConstraint } from '@/shared/database/unique-violation';
import { ConflictError } from '@/shared/errors/application.error';
import type { UserType } from '../../domain/enums/user-type.enum';
import type { UserRepository } from '../../domain/repositories/user.repository';

interface UserRow {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  registrationNumber: string | null;
  photoUrl: string | null;
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
    photo_url AS "photoUrl",
    type,
    active,
    token_version AS "tokenVersion",
    created_at AS "createdAt"`;

const WRITABLE_COLUMNS = `name, email, password_hash, registration_number, photo_url, type, active, token_version`;

@Injectable()
export class PgUserRepository implements UserRepository {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

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
      return await (user.id ? this.updateExisting(user) : this.insertNew(user));
    } catch (error) {
      throw this.translateConflict(error);
    }
  }

  private translateConflict(error: unknown): unknown {
    const constraint = violatedUniqueConstraint(error);
    const message = constraint === null ? undefined : CONFLICT_MESSAGES[constraint];

    return message ? new ConflictError(message) : error;
  }

  private async insertNew(user: User): Promise<User> {
    const rows = await this.users.query<UserRow[]>(
      `INSERT INTO users (${WRITABLE_COLUMNS})
        VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, FALSE), COALESCE($8, 0))
        RETURNING ${USER_COLUMNS};`,
      this.writableValues(user),
    );

    if (rows.length === 0) {
      throw new Error('Failed to persist user in database.');
    }

    return this.toEntity(rows[0]);
  }

  private async updateExisting(user: User): Promise<User> {
    const [rows] = await this.users.query<[UserRow[], number]>(
      `UPDATE users
        SET name = $2, email = $3, password_hash = $4, registration_number = $5,
            photo_url = $6, type = $7, active = COALESCE($8, active),
            token_version = COALESCE($9, token_version)
        WHERE id = $1
        RETURNING ${USER_COLUMNS};`,
      [user.id, ...this.writableValues(user)],
    );

    if (rows.length === 0) {
      throw new Error(`User ${user.id} not found.`);
    }

    return this.toEntity(rows[0]);
  }

  private toEntity(row: UserRow): User {
    return this.users.create(row);
  }

  private writableValues(user: User): unknown[] {
    return [
      user.name,
      user.email,
      user.passwordHash,
      user.registrationNumber,
      user.photoUrl,
      user.type,
      user.active,
      user.tokenVersion,
    ];
  }

  private async queryOne(sql: string, params: unknown[]): Promise<User | null> {
    const rows = await this.users.query<UserRow[]>(sql, params);
    return rows.length > 0 ? this.toEntity(rows[0]) : null;
  }
}
