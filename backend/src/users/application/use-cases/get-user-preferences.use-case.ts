import { Inject, Injectable } from '@nestjs/common';
import { UserPreferences } from '../../domain/entities/user-preferences.entity';
import {
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesRepository,
} from '../../domain/repositories/user-preferences.repository';

export interface GetUserPreferencesInput {
  userId: string;
}

@Injectable()
export class GetUserPreferencesUseCase {
  constructor(
    @Inject(USER_PREFERENCES_REPOSITORY)
    private readonly preferences: UserPreferencesRepository,
  ) {}

  async execute(input: GetUserPreferencesInput): Promise<UserPreferences> {
    const saved = await this.preferences.findByUserId(input.userId);
    return saved ?? UserPreferences.defaults(input.userId);
  }
}
