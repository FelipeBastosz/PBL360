import {
  DEFAULT_SYSTEM_COLOR,
  UserPreferences,
} from '../../domain/entities/user-preferences.entity';
import { UserTheme } from '../../domain/enums/user-theme.enum';
import { UserThemePayload } from '../../application/dtos/user-theme-payload.enum';
import { toDomainTheme, toUserPreferencesResponse } from './user-preferences.mapper';

describe('user-preferences.mapper', () => {
  it('maps payload themes to domain themes', () => {
    expect(toDomainTheme(UserThemePayload.CLARO)).toBe(UserTheme.LIGHT);
    expect(toDomainTheme(UserThemePayload.ESCURO)).toBe(UserTheme.DARK);
  });

  it('maps UserPreferences entity to response DTO in Portuguese', () => {
    const lightDefaults = UserPreferences.defaults('user-1');
    const customDark = UserPreferences.create({
      userId: 'user-2',
      theme: UserTheme.DARK,
      color: '#ff00aa',
    });

    expect(toUserPreferencesResponse(lightDefaults)).toEqual({
      tema: UserThemePayload.CLARO,
      cor: DEFAULT_SYSTEM_COLOR,
    });
    expect(toUserPreferencesResponse(customDark)).toEqual({
      tema: UserThemePayload.ESCURO,
      cor: '#FF00AA',
    });
  });
});
