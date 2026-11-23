import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstRowOrNull, requireFirstRow } from '@/shared/database/rows';
import {
  DEFAULT_SYSTEM_COLOR,
  DEFAULT_USER_THEME,
  UserPreferences,
} from '../../domain/entities/user-preferences.entity';
import type { UserTheme } from '../../domain/enums/user-theme.enum';
import type {
  UserPreferencesPatch,
  UserPreferencesRepository,
} from '../../domain/repositories/user-preferences.repository';

interface UserPreferencesRow {
  userId: string;
  theme: UserTheme;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const USER_PREFERENCES_COLUMNS = `
    user_id AS "userId",
    theme,
    color,
    created_at AS "createdAt",
    updated_at AS "updatedAt"`;

const UPSERT_USER_PREFERENCES_QUERY = `
  INSERT INTO user_preferences (user_id, theme, color)
  VALUES ($1, COALESCE($2, $4), COALESCE($3, $5))
  ON CONFLICT (user_id) DO UPDATE
    SET theme = COALESCE($2, user_preferences.theme),
        color = COALESCE($3, user_preferences.color),
        updated_at = now()
  RETURNING ${USER_PREFERENCES_COLUMNS};`;

@Injectable()
export class PgUserPreferencesRepository implements UserPreferencesRepository {
  constructor(
    @InjectRepository(UserPreferences)
    private readonly preferences: Repository<UserPreferences>,
  ) {}

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    const rows = await this.preferences.query<UserPreferencesRow[]>(
      `SELECT ${USER_PREFERENCES_COLUMNS}
        FROM user_preferences
        WHERE user_id = $1
        LIMIT 1;`,
      [userId],
    );
    const row = firstRowOrNull(rows);

    return row ? this.preferences.create(row) : null;
  }

  async upsert(userId: string, patch: UserPreferencesPatch): Promise<UserPreferences> {
    const rows = await this.preferences.query<UserPreferencesRow[]>(UPSERT_USER_PREFERENCES_QUERY, [
      userId,
      patch.theme ?? null,
      patch.color ?? null,
      DEFAULT_USER_THEME,
      DEFAULT_SYSTEM_COLOR,
    ]);

    return this.preferences.create(
      requireFirstRow(rows, `Failed to persist preferences for user ${userId}.`),
    );
  }
}
