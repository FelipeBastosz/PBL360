import { createContext } from 'react';
import type { ThemePreference, UserPreferences } from '@/types/preferences';
import { DEFAULT_USER_PREFERENCES } from '@/utils/themePalette';

export type PreferencesContextValue = {
  preferences: UserPreferences;
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  setTheme: (theme: ThemePreference) => Promise<boolean>;
  setColor: (hex: string) => Promise<boolean>;
  resetColor: () => Promise<boolean>;
  clearError: () => void;
};

export const PREFERENCES_SAVE_ERROR_MESSAGE =
  'Não foi possível salvar suas preferências. A configuração anterior foi mantida.';

export const DEFAULT_PREFERENCES_CONTEXT: PreferencesContextValue = {
  preferences: DEFAULT_USER_PREFERENCES,
  isLoading: false,
  isSaving: false,
  errorMessage: null,
  setTheme: async () => false,
  setColor: async () => false,
  resetColor: async () => false,
  clearError: () => undefined,
};

export const PreferencesContext = createContext<PreferencesContextValue>(
  DEFAULT_PREFERENCES_CONTEXT,
);
