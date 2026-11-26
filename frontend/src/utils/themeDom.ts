import type { UserPreferences } from '@/types/preferences';
import {
  DEFAULT_USER_PREFERENCES,
  deriveBrandTokens,
  normalizeUserPreferences,
  type DerivedBrandTokens,
} from './themePalette';

function buildCssVariables(tokens: DerivedBrandTokens): Record<string, string> {
  return {
    '--color-brand-50': tokens.scale[50],
    '--color-brand-100': tokens.scale[100],
    '--color-brand-200': tokens.scale[200],
    '--color-brand-300': tokens.scale[300],
    '--color-brand-400': tokens.scale[400],
    '--color-brand-500': tokens.scale[500],
    '--color-brand-600': tokens.scale[600],
    '--color-brand-700': tokens.scale[700],
    '--color-brand-800': tokens.scale[800],
    '--color-brand-900': tokens.scale[900],
    '--color-brand-950': tokens.scale[950],
    '--color-brand-primary': tokens.primary,
    '--color-brand-primary-hover': tokens.primaryHover,
    '--color-brand-primary-border': tokens.primaryBorder,
    '--color-brand-on-primary': tokens.onPrimary,
    '--color-brand-accent': tokens.accent,
    '--color-brand-stripe': tokens.stripe,
    '--color-brand-soft': tokens.soft,
    '--color-brand-soft-hover': tokens.softHover,
    '--color-brand-border': tokens.border,
    '--color-brand-ring': tokens.ring,
    '--color-brand-shadow': tokens.shadow,
  };
}

function updateThemeColorMeta(color: string): void {
  if (typeof document === 'undefined') return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
}

export function applyPreferencesToDom(preferences: UserPreferences): DerivedBrandTokens {
  const normalized = normalizeUserPreferences(preferences);
  const tokens = deriveBrandTokens(normalized.cor, normalized.tema);

  if (typeof document === 'undefined') return tokens;

  const root = document.documentElement;
  const isDark = normalized.tema === 'ESCURO';
  root.dataset.theme = isDark ? 'dark' : 'light';
  root.classList.toggle('dark', isDark);

  const vars = buildCssVariables(tokens);
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }

  updateThemeColorMeta(tokens.themeColorMeta);
  return tokens;
}

export function resetPreferencesDom(): DerivedBrandTokens {
  return applyPreferencesToDom(DEFAULT_USER_PREFERENCES);
}
