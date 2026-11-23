import type { UserPreferences } from '../entities/user-preferences.entity';
import type { UserTheme } from '../enums/user-theme.enum';

export interface UserPreferencesPatch {
  theme?: UserTheme;
  color?: string;
}

export interface UserPreferencesRepository {
  findByUserId(userId: string): Promise<UserPreferences | null>;
  upsert(userId: string, patch: UserPreferencesPatch): Promise<UserPreferences>;
}

export const USER_PREFERENCES_REPOSITORY = Symbol('UserPreferencesRepository');
