import { UserTheme } from '../../domain/enums/user-theme.enum';
import type { UserPreferences } from '../../domain/entities/user-preferences.entity';
import { UserThemePayload } from '../../application/dtos/user-theme-payload.enum';
import type { UserPreferencesResponseDto } from '../../application/dtos/user-preferences-response.dto';

const DOMAIN_THEME: Record<UserThemePayload, UserTheme> = {
  [UserThemePayload.CLARO]: UserTheme.LIGHT,
  [UserThemePayload.ESCURO]: UserTheme.DARK,
};

const PAYLOAD_THEME: Record<UserTheme, UserThemePayload> = {
  [UserTheme.LIGHT]: UserThemePayload.CLARO,
  [UserTheme.DARK]: UserThemePayload.ESCURO,
};

export const toDomainTheme = (theme: UserThemePayload): UserTheme => DOMAIN_THEME[theme];

export const toUserPreferencesResponse = (
  preferences: UserPreferences,
): UserPreferencesResponseDto => ({
  tema: PAYLOAD_THEME[preferences.theme],
  cor: preferences.color,
});
