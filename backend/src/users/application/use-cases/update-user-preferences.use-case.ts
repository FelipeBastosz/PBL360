import { Inject, Injectable } from '@nestjs/common';
import { UserPreferences } from '../../domain/entities/user-preferences.entity';
import type { UserTheme } from '../../domain/enums/user-theme.enum';
import {
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesPatch,
  type UserPreferencesRepository,
} from '../../domain/repositories/user-preferences.repository';

export interface UpdateUserPreferencesInput {
  userId: string;
  theme?: UserTheme;
  color?: string;
}

@Injectable()
export class UpdateUserPreferencesUseCase {
  constructor(
    @Inject(USER_PREFERENCES_REPOSITORY)
    private readonly preferences: UserPreferencesRepository,
  ) {}

  async execute(input: UpdateUserPreferencesInput): Promise<UserPreferences> {
    const patch = this.buildPatch(input);

    if (patch.theme === undefined && patch.color === undefined) {
      const saved = await this.preferences.findByUserId(input.userId);
      return saved ?? UserPreferences.defaults(input.userId);
    }

    return this.preferences.upsert(input.userId, patch);
  }

  private buildPatch(input: UpdateUserPreferencesInput): UserPreferencesPatch {
    return {
      ...(input.theme !== undefined && { theme: UserPreferences.parseTheme(input.theme) }),
      ...(input.color !== undefined && { color: UserPreferences.normalizeColor(input.color) }),
    };
  }
}
