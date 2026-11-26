export type ThemePreference = 'CLARO' | 'ESCURO';

export interface UserPreferences {
  tema: ThemePreference;
  cor: string;
}

export interface UpdateUserPreferencesPayload {
  tema?: ThemePreference;
  cor?: string;
}

export interface SystemColorPreset {
  readonly id: string;
  readonly name: string;
  readonly hex: string;
  readonly isDefault?: boolean;
}
