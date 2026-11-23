import { afterEach, describe, expect, it } from 'vitest';
import { getContrastRatio } from './colorMath';
import { applyPreferencesToDom, resetPreferencesDom } from './themeDom';
import {
  DARK_CARD_HEX,
  DARK_ELEVATED_HEX,
  DEFAULT_SYSTEM_COLOR,
  DEFAULT_THEME,
  deriveBrandTokens,
  getColorDisplayName,
  LIGHT_SURFACE_HEX,
  normalizeHexColor,
  normalizeThemePreference,
  normalizeUserPreferences,
  SYSTEM_COLOR_PALETTE,
} from './themePalette';

afterEach(() => {
  resetPreferencesDom();
});

describe('SYSTEM_COLOR_PALETTE', () => {
  it('defines the 10 system colors in exact chromatic order', () => {
    expect(SYSTEM_COLOR_PALETTE.map((c) => [c.name, c.hex])).toEqual([
      ['Vermelho Vinho', '#7F1D1D'],
      ['Vermelho', '#B91C1C'],
      ['Terracota', '#C2410C'],
      ['Verde Escuro', '#166534'],
      ['Verde Petróleo', '#0F766E'],
      ['Azul Claro', '#0369A1'],
      ['Azul Padrão', '#000077'],
      ['Roxo', '#4C1D95'],
      ['Lilás', '#9333EA'],
      ['Preto', '#18181B'],
    ]);

    const defaults = SYSTEM_COLOR_PALETTE.filter((c) => c.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].hex).toBe(DEFAULT_SYSTEM_COLOR);
  });
});

describe('normalization and fallbacks', () => {
  it('falls back safely to defaults on invalid inputs', () => {
    expect(normalizeHexColor(null)).toBe(DEFAULT_SYSTEM_COLOR);
    expect(normalizeHexColor('')).toBe(DEFAULT_SYSTEM_COLOR);
    expect(normalizeHexColor('#123')).toBe(DEFAULT_SYSTEM_COLOR);
    expect(normalizeHexColor('not-a-color')).toBe(DEFAULT_SYSTEM_COLOR);
    expect(normalizeHexColor('  #0f766e  ')).toBe('#0F766E');

    expect(normalizeThemePreference(undefined)).toBe(DEFAULT_THEME);
    expect(normalizeThemePreference('INVALID')).toBe(DEFAULT_THEME);
    expect(normalizeThemePreference('ESCURO')).toBe('ESCURO');

    expect(normalizeUserPreferences({ tema: 'ESCURO', cor: '#9333ea' })).toEqual({
      tema: 'ESCURO',
      cor: '#9333EA',
    });
  });

  it('resolves display names for presets and custom hex colors', () => {
    expect(getColorDisplayName('#000077')).toBe('Azul Padrão');
    expect(getColorDisplayName('#18181b')).toBe('Preto');
    expect(getColorDisplayName('#123456')).toBe('#123456');
  });
});

describe('deriveBrandTokens', () => {
  it('derives complete tonal scales and WCAG-compliant light mode contrast for all 10 presets', () => {
    for (const preset of SYSTEM_COLOR_PALETTE) {
      const tokens = deriveBrandTokens(preset.hex, 'CLARO');
      expect(Object.keys(tokens.scale)).toHaveLength(11);
      expect(tokens.primary).toBe(preset.hex);
      expect(tokens.onPrimary).toBe('#FFFFFF');
      expect(getContrastRatio(tokens.primary, tokens.onPrimary)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(tokens.accent, LIGHT_SURFACE_HEX)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('derives high-contrast dark mode accents for all 10 presets including #000077 and #18181B', () => {
    for (const preset of SYSTEM_COLOR_PALETTE) {
      const tokens = deriveBrandTokens(preset.hex, 'ESCURO');
      expect(tokens.accent).not.toBe('#000077');
      expect(tokens.accent).not.toBe('#18181B');
      expect(getContrastRatio(tokens.accent, DARK_ELEVATED_HEX)).toBeGreaterThanOrEqual(5.5);
      expect(getContrastRatio(tokens.accent, DARK_CARD_HEX)).toBeGreaterThanOrEqual(5.5);
      expect(getContrastRatio(tokens.primary, tokens.onPrimary)).toBeGreaterThanOrEqual(4.5);
      expect(tokens.primaryBorder).not.toBe('transparent');
    }
  });

  it('gives Preto (#18181B) a differentiated elevated surface, visible border, and crisp neutral accent in dark mode', () => {
    const tokens = deriveBrandTokens('#18181B', 'ESCURO');
    expect(tokens.primary).toBe('#27272A');
    expect(tokens.primaryBorder).toBe('#52525B');
    expect(tokens.accent).toBe('#E4E4E7');
    expect(tokens.onPrimary).toBe('#FFFFFF');
  });

  it('handles custom light hex colors safely in both themes', () => {
    const lightTokens = deriveBrandTokens('#FACC15', 'CLARO');
    expect(getContrastRatio(lightTokens.accent, LIGHT_SURFACE_HEX)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(lightTokens.primary, lightTokens.onPrimary)).toBeGreaterThanOrEqual(
      4.5,
    );

    const darkTokens = deriveBrandTokens('#FACC15', 'ESCURO');
    expect(getContrastRatio(darkTokens.accent, DARK_CARD_HEX)).toBeGreaterThanOrEqual(5.5);
  });
});

describe('applyPreferencesToDom and resetPreferencesDom', () => {
  it('applies data-theme, dark class, CSS variables, and theme-color meta tag', () => {
    const tokens = applyPreferencesToDom({ tema: 'ESCURO', cor: '#0F766E' });
    const root = document.documentElement;

    expect(root.dataset.theme).toBe('dark');
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.style.getPropertyValue('--color-brand-primary')).toBe('#0F766E');
    expect(root.style.getPropertyValue('--color-brand-accent')).toBe(tokens.accent);

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    expect(meta?.content).toBe('#0F766E');

    resetPreferencesDom();
    expect(root.dataset.theme).toBe('light');
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.style.getPropertyValue('--color-brand-primary')).toBe('#000077');
    expect(meta?.content).toBe('#000077');
  });
});
