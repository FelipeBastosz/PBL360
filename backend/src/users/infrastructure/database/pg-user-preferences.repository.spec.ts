import {
  DEFAULT_SYSTEM_COLOR,
  DEFAULT_USER_THEME,
} from '../../domain/entities/user-preferences.entity';
import { PgUserPreferencesRepository } from './pg-user-preferences.repository';

describe('PgUserPreferencesRepository', () => {
  const preferences = {
    userId: 'u1',
    theme: DEFAULT_USER_THEME,
    color: DEFAULT_SYSTEM_COLOR,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
  };

  it('returns null for missing preferences and maps a saved row', async () => {
    const query = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([preferences]);
    const create = jest.fn((row: unknown) => row);
    const repository = new PgUserPreferencesRepository({ query, create } as never);

    await expect(repository.findByUserId('u1')).resolves.toBeNull();
    await expect(repository.findByUserId('u1')).resolves.toEqual(preferences);
    expect(create).toHaveBeenCalledWith(preferences);
  });

  it('upserts partial values with defaults and rejects a missing returning row', async () => {
    const query = jest.fn().mockResolvedValueOnce([preferences]).mockResolvedValueOnce([]);
    const create = jest.fn((row: unknown) => row);
    const repository = new PgUserPreferencesRepository({ query, create } as never);

    await expect(repository.upsert('u1', { color: '#123456' })).resolves.toEqual(preferences);
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining('ON CONFLICT (user_id)'), [
      'u1',
      null,
      '#123456',
      DEFAULT_USER_THEME,
      DEFAULT_SYSTEM_COLOR,
    ]);
    await expect(repository.upsert('u1', {})).rejects.toThrow(
      'Failed to persist preferences for user u1.',
    );
  });
});
