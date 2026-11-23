import {
  DEFAULT_SYSTEM_COLOR,
  DEFAULT_USER_THEME,
  UserPreferences,
} from '../../domain/entities/user-preferences.entity';
import { UserTheme } from '../../domain/enums/user-theme.enum';
import { InvalidUserError } from '../../domain/errors/invalid-user.error';
import type {
  UserPreferencesPatch,
  UserPreferencesRepository,
} from '../../domain/repositories/user-preferences.repository';
import { UpdateUserPreferencesUseCase } from './update-user-preferences.use-case';

class InMemoryUserPreferencesRepository implements UserPreferencesRepository {
  private readonly store = new Map<string, UserPreferences>();

  findByUserId(userId: string): Promise<UserPreferences | null> {
    return Promise.resolve(this.store.get(userId) ?? null);
  }

  upsert(userId: string, patch: UserPreferencesPatch): Promise<UserPreferences> {
    const current = this.store.get(userId) ?? UserPreferences.defaults(userId);
    const updated = current.withUpdates(patch);
    this.store.set(userId, updated);
    return Promise.resolve(updated);
  }
}

describe('UpdateUserPreferencesUseCase', () => {
  let useCase: UpdateUserPreferencesUseCase;
  let repository: InMemoryUserPreferencesRepository;

  beforeEach(() => {
    repository = new InMemoryUserPreferencesRepository();
    useCase = new UpdateUserPreferencesUseCase(repository);
  });

  it('updates theme only on first save and defaults color to system color', async () => {
    const result = await useCase.execute({ userId: 'user-1', theme: UserTheme.DARK });

    expect(result.theme).toBe(UserTheme.DARK);
    expect(result.color).toBe(DEFAULT_SYSTEM_COLOR);
  });

  it('updates color only on first save and defaults theme to LIGHT', async () => {
    const result = await useCase.execute({ userId: 'user-1', color: '#1E88E5' });

    expect(result.theme).toBe(DEFAULT_USER_THEME);
    expect(result.color).toBe('#1E88E5');
  });

  it('updates both theme and color together', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      theme: UserTheme.DARK,
      color: '#2E7D32',
    });

    expect(result.theme).toBe(UserTheme.DARK);
    expect(result.color).toBe('#2E7D32');
  });

  it('preserves unsent field across subsequent partial updates', async () => {
    await useCase.execute({ userId: 'user-1', theme: UserTheme.DARK, color: '#2E7D32' });

    const afterThemeChange = await useCase.execute({ userId: 'user-1', theme: UserTheme.LIGHT });
    expect(afterThemeChange.theme).toBe(UserTheme.LIGHT);
    expect(afterThemeChange.color).toBe('#2E7D32');

    const afterColorChange = await useCase.execute({ userId: 'user-1', color: '#D32F2F' });
    expect(afterColorChange.theme).toBe(UserTheme.LIGHT);
    expect(afterColorChange.color).toBe('#D32F2F');
  });

  it('restores the default system color while preserving theme', async () => {
    await useCase.execute({ userId: 'user-1', theme: UserTheme.DARK, color: '#D32F2F' });

    const restored = await useCase.execute({ userId: 'user-1', color: DEFAULT_SYSTEM_COLOR });

    expect(restored.theme).toBe(UserTheme.DARK);
    expect(restored.color).toBe(DEFAULT_SYSTEM_COLOR);
  });

  it('normalizes lowercase hex color before persisting', async () => {
    const upsertSpy = jest.spyOn(repository, 'upsert');

    const result = await useCase.execute({ userId: 'user-1', color: '#ff00aa' });

    expect(upsertSpy).toHaveBeenCalledWith('user-1', { color: '#FF00AA' });
    expect(result.color).toBe('#FF00AA');
  });

  it('returns current preferences without writing when patch is empty', async () => {
    await useCase.execute({ userId: 'user-1', theme: UserTheme.DARK, color: '#ABCDEF' });
    const upsertSpy = jest.spyOn(repository, 'upsert');

    const result = await useCase.execute({ userId: 'user-1' });

    expect(upsertSpy).not.toHaveBeenCalled();
    expect(result.theme).toBe(UserTheme.DARK);
    expect(result.color).toBe('#ABCDEF');
  });

  it('rejects invalid theme or color without calling repository upsert', async () => {
    const upsertSpy = jest.spyOn(repository, 'upsert');

    await expect(
      useCase.execute({ userId: 'user-1', theme: 'INVALID' as UserTheme }),
    ).rejects.toThrow(InvalidUserError);
    await expect(useCase.execute({ userId: 'user-1', color: '#fff' })).rejects.toThrow(
      InvalidUserError,
    );

    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('propagates repository write failures without losing previous state', async () => {
    await useCase.execute({ userId: 'user-1', theme: UserTheme.DARK, color: '#112233' });
    jest.spyOn(repository, 'upsert').mockRejectedValueOnce(new Error('Database write failed'));

    await expect(
      useCase.execute({ userId: 'user-1', theme: UserTheme.LIGHT, color: '#445566' }),
    ).rejects.toThrow('Database write failed');

    const preserved = await repository.findByUserId('user-1');
    expect(preserved?.theme).toBe(UserTheme.DARK);
    expect(preserved?.color).toBe('#112233');
  });
});
