import type { SystemColorPreset, ThemePreference, UserPreferences } from '@/types/preferences';
import {
  clamp,
  getContrastRatio,
  hexToRgb,
  hslToRgb,
  isValidHexColor,
  mixHex,
  rgbToHex,
  rgbToHsl,
  toRgbChannels,
} from './colorMath';

export const DEFAULT_SYSTEM_COLOR = '#000077';
export const DEFAULT_THEME: ThemePreference = 'CLARO';

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  tema: DEFAULT_THEME,
  cor: DEFAULT_SYSTEM_COLOR,
};

export const LIGHT_SURFACE_HEX = '#FFFFFF';
export const DARK_SURFACE_HEX = '#0D1117';
export const DARK_ELEVATED_HEX = '#161D2B';
export const DARK_CARD_HEX = '#1C2536';

export const SYSTEM_COLOR_PALETTE: readonly SystemColorPreset[] = [
  { id: 'wine-red', name: 'Vermelho Vinho', hex: '#7F1D1D' },
  { id: 'red', name: 'Vermelho', hex: '#B91C1C' },
  { id: 'terracotta', name: 'Terracota', hex: '#C2410C' },
  { id: 'dark-green', name: 'Verde Escuro', hex: '#166534' },
  { id: 'teal', name: 'Verde Petróleo', hex: '#0F766E' },
  { id: 'light-blue', name: 'Azul Claro', hex: '#0369A1' },
  { id: 'default-blue', name: 'Azul Padrão', hex: DEFAULT_SYSTEM_COLOR, isDefault: true },
  { id: 'purple', name: 'Roxo', hex: '#4C1D95' },
  { id: 'lilac', name: 'Lilás', hex: '#9333EA' },
  { id: 'black', name: 'Preto', hex: '#18181B' },
] as const;

export interface BrandScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface DerivedBrandTokens {
  scale: BrandScale;
  primary: string;
  primaryHover: string;
  primaryBorder: string;
  onPrimary: string;
  accent: string;
  stripe: string;
  soft: string;
  softHover: string;
  border: string;
  ring: string;
  shadow: string;
  themeColorMeta: string;
}

export function normalizeHexColor(value: string | null | undefined): string {
  if (!value) return DEFAULT_SYSTEM_COLOR;
  const trimmed = value.trim().toUpperCase();
  return isValidHexColor(trimmed) ? trimmed : DEFAULT_SYSTEM_COLOR;
}

export function normalizeThemePreference(value: string | null | undefined): ThemePreference {
  return value === 'ESCURO' ? 'ESCURO' : 'CLARO';
}

export function normalizeUserPreferences(input?: Partial<UserPreferences> | null): UserPreferences {
  return {
    tema: normalizeThemePreference(input?.tema),
    cor: normalizeHexColor(input?.cor),
  };
}

export function getSystemColorPreset(hex: string): SystemColorPreset | undefined {
  const normalized = normalizeHexColor(hex);
  return SYSTEM_COLOR_PALETTE.find((preset) => preset.hex === normalized);
}

export function getColorDisplayName(hex: string): string {
  const normalized = normalizeHexColor(hex);
  return getSystemColorPreset(normalized)?.name ?? normalized;
}

function isNeutralColor(hex: string): boolean {
  return rgbToHsl(hexToRgb(hex)).s < 0.12;
}

function ensureLightModeAccent(baseHex: string): string {
  let candidate = baseHex;
  for (let step = 1; step <= 10; step += 1) {
    if (getContrastRatio(candidate, LIGHT_SURFACE_HEX) >= 4.5) return candidate;
    candidate = mixHex(baseHex, '#000000', step * 0.08);
  }
  return candidate;
}

function deriveDarkModeAccent(baseHex: string): string {
  if (isNeutralColor(baseHex)) return '#E4E4E7';
  const hsl = rgbToHsl(hexToRgb(baseHex));
  const saturation = clamp(hsl.s, 0.65, 0.88);
  let candidate = baseHex;

  for (let l = 0.66; l <= 0.88; l += 0.02) {
    candidate = rgbToHex(hslToRgb({ h: hsl.h, s: saturation, l }));
    if (getContrastRatio(candidate, DARK_CARD_HEX) >= 5.5) return candidate;
  }
  return candidate;
}

function resolveOnPrimary(primaryHex: string): string {
  return getContrastRatio(primaryHex, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#0F172A';
}

function deriveLightTokens(baseHex: string): DerivedBrandTokens {
  const hsl = rgbToHsl(hexToRgb(baseHex));
  const primaryHover =
    hsl.l < 0.28 ? mixHex(baseHex, '#FFFFFF', 0.14) : mixHex(baseHex, '#000000', 0.14);
  const accent = ensureLightModeAccent(baseHex);
  const soft = mixHex(baseHex, '#FFFFFF', 0.92);
  const softHover = mixHex(baseHex, '#FFFFFF', 0.85);
  const border = mixHex(baseHex, '#FFFFFF', 0.72);

  return {
    scale: {
      50: soft,
      100: mixHex(baseHex, '#FFFFFF', 0.84),
      200: mixHex(baseHex, '#FFFFFF', 0.7),
      300: mixHex(baseHex, '#FFFFFF', 0.48),
      400: mixHex(baseHex, '#FFFFFF', 0.3),
      500: mixHex(baseHex, '#FFFFFF', 0.16),
      600: mixHex(baseHex, '#FFFFFF', 0.08),
      700: primaryHover,
      800: mixHex(baseHex, '#000000', 0.2),
      900: baseHex,
      950: mixHex(baseHex, '#000000', 0.4),
    },
    primary: baseHex,
    primaryHover,
    primaryBorder: 'transparent',
    onPrimary: resolveOnPrimary(baseHex),
    accent,
    stripe: baseHex,
    soft,
    softHover,
    border,
    ring: `rgb(${toRgbChannels(accent)} / 0.16)`,
    shadow: `rgb(${toRgbChannels(baseHex)} / 0.45)`,
    themeColorMeta: baseHex,
  };
}

function deriveDarkTokens(baseHex: string): DerivedBrandTokens {
  const neutral = isNeutralColor(baseHex);
  const accent = deriveDarkModeAccent(baseHex);
  const primary = neutral ? '#27272A' : baseHex;
  const primaryHover = neutral ? '#3F3F46' : mixHex(baseHex, '#FFFFFF', 0.14);
  const primaryBorder = neutral ? '#52525B' : `rgb(${toRgbChannels(accent)} / 0.32)`;
  const soft = neutral ? '#27272A' : mixHex(accent, DARK_ELEVATED_HEX, 0.84);
  const softHover = neutral ? '#32323A' : mixHex(accent, DARK_ELEVATED_HEX, 0.76);
  const border = neutral ? '#3F3F46' : mixHex(accent, DARK_ELEVATED_HEX, 0.66);

  return {
    scale: {
      50: soft,
      100: softHover,
      200: border,
      300: mixHex(accent, '#9CA8BD', 0.35),
      400: mixHex(accent, DARK_ELEVATED_HEX, 0.45),
      500: mixHex(accent, DARK_ELEVATED_HEX, 0.3),
      600: accent,
      700: primaryHover,
      800: mixHex(primary, '#000000', 0.22),
      900: primary,
      950: mixHex(primary, '#000000', 0.42),
    },
    primary,
    primaryHover,
    primaryBorder,
    onPrimary: resolveOnPrimary(primary),
    accent,
    stripe: accent,
    soft,
    softHover,
    border,
    ring: `rgb(${toRgbChannels(accent)} / 0.28)`,
    shadow: 'rgb(0 0 0 / 0.55)',
    themeColorMeta: primary,
  };
}

export function deriveBrandTokens(hex: string, theme: ThemePreference): DerivedBrandTokens {
  const normalized = normalizeHexColor(hex);
  return theme === 'ESCURO' ? deriveDarkTokens(normalized) : deriveLightTokens(normalized);
}
