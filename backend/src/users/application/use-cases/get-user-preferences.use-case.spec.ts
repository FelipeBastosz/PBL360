import {
  DEFAULT_SYSTEM_COLOR,
  DEFAULT_USER_THEME,
  UserPreferences,
} from '../../domain/entities/user-preferences.entity';
import { UserTheme } from '../../domain/enums/user-theme.enum';
import type { UserPreferencesRepository } from '../../domain/repositories/user-preferences.repository';
import { GetUserPreferencesUseCase } from './get-user-preferences.use-case';

describe('GetUserPreferencesUseCase', () => {
  let useCase: GetUserPreferencesUseCase;
  let repository: jest.Mocked<UserPreferencesRepository>;

  beforeEach(() => {
    repository = {
      findByUserId: jest.fn(),
      upsert: jest.fn(),
    };
    useCase = new GetUserPreferencesUseCase(repository);
  });

  it('returns default theme and system color when user has no saved preferences', async () => {
    repository.findByUserId.mockResolvedValue(null);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.userId).toBe('user-1');
    expect(result.theme).toBe(DEFAULT_USER_THEME);
    expect(result.color).toBe(DEFAULT_SYSTEM_COLOR);
    expect(repository.findByUserId).toHaveBeenCalledWith('user-1');
  });

  it('returns saved preferences when present', async () => {
    const saved = UserPreferences.create({
      userId: 'user-1',
      theme: UserTheme.DARK,
      color: '#1E88E5',
    });
    repository.findByUserId.mockResolvedValue(saved);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toBe(saved);
    expect(result.theme).toBe(UserTheme.DARK);
    expect(result.color).toBe('#1E88E5');
  });
});
