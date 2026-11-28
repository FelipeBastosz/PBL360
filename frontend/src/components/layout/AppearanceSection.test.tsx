import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PREFERENCES_CONTEXT,
  PreferencesContext,
  type PreferencesContextValue,
} from '@/contexts/preferencesContext';
import { SYSTEM_COLOR_PALETTE } from '@/utils/themePalette';
import { AppearanceSection } from './AppearanceSection';

function renderSection(overrides: Partial<PreferencesContextValue> = {}) {
  const value: PreferencesContextValue = {
    ...DEFAULT_PREFERENCES_CONTEXT,
    setTheme: vi.fn().mockResolvedValue(true),
    setColor: vi.fn().mockResolvedValue(true),
    resetColor: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
  const result = render(
    <PreferencesContext.Provider value={value}>
      <AppearanceSection />
    </PreferencesContext.Provider>,
  );
  return { ...result, value };
}

afterEach(cleanup);

describe('AppearanceSection', () => {
  it('renders spectrum slider, hue slider, and synced HEX and RGB inputs', () => {
    renderSection({ preferences: { tema: 'CLARO', cor: '#9751F2' } });

    expect(screen.getByRole('slider', { name: 'Saturação e brilho' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Matiz' })).toBeInTheDocument();
    expect(screen.getByLabelText('Código hexadecimal da cor')).toHaveValue('#9751F2');
    expect(screen.getByLabelText('Vermelho (R)')).toHaveValue('151');
    expect(screen.getByLabelText('Verde (G)')).toHaveValue('81');
    expect(screen.getByLabelText('Azul (B)')).toHaveValue('242');
  });

  it('calls setTheme via keyboard navigation and calls setColor when editing HEX or RGB inputs', async () => {
    const user = userEvent.setup();
    const { value } = renderSection();

    const lightRadio = screen.getByRole('radio', { name: 'Claro' });
    const darkRadio = screen.getByRole('radio', { name: 'Escuro' });

    lightRadio.focus();
    await user.keyboard('{ArrowRight}');
    expect(darkRadio).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(value.setTheme).toHaveBeenCalledWith('ESCURO');

    const hexInput = screen.getByLabelText('Código hexadecimal da cor');
    await user.clear(hexInput);
    await user.type(hexInput, '#0F766E');
    expect(value.setColor).toHaveBeenCalledWith('#0F766E');

    const redInput = screen.getByLabelText('Vermelho (R)');
    await user.clear(redInput);
    await user.type(redInput, '255');
    expect(value.setColor).toHaveBeenLastCalledWith('#FF766E');
  });

  it('adjusts hue and spectrum via keyboard arrows', async () => {
    const user = userEvent.setup();
    const { value } = renderSection({ preferences: { tema: 'CLARO', cor: '#9751F2' } });

    const hueSlider = screen.getByRole('slider', { name: 'Matiz' });
    hueSlider.focus();
    await user.keyboard('{ArrowRight}');
    expect(value.setColor).toHaveBeenCalled();

    const spectrum = screen.getByRole('slider', { name: 'Saturação e brilho' });
    spectrum.focus();
    await user.keyboard('{ArrowLeft}');
    expect(value.setColor).toHaveBeenCalledTimes(2);
  });

  it('renders all 10 suggested colors and selects a swatch on click or keyboard navigation', async () => {
    const user = userEvent.setup();
    const { value } = renderSection();

    const colorGroup = screen.getByRole('radiogroup', { name: 'Cores sugeridas' });
    const swatches = within(colorGroup).getAllByRole('radio');

    expect(swatches).toHaveLength(10);
    expect(swatches.map((el) => el.getAttribute('title'))).toEqual(
      SYSTEM_COLOR_PALETTE.map((c) => c.name),
    );
    expect(screen.getByText('Azul Padrão')).toBeInTheDocument();

    const firstSwatch = screen.getByRole('radio', { name: 'Vermelho Vinho' });
    const secondSwatch = screen.getByRole('radio', { name: 'Vermelho' });
    firstSwatch.focus();
    await user.keyboard('{ArrowRight}');
    expect(secondSwatch).toHaveFocus();
    await user.keyboard(' ');
    expect(value.setColor).toHaveBeenCalledWith('#B91C1C');
  });

  it('disables Restaurar cor padrão when default color is active and calls resetColor otherwise', async () => {
    const user = userEvent.setup();
    const { unmount } = renderSection({
      preferences: { tema: 'CLARO', cor: '#000077' },
    });

    expect(screen.getByRole('button', { name: /restaurar cor padrão/i })).toBeDisabled();
    unmount();

    const { value } = renderSection({
      preferences: { tema: 'ESCURO', cor: '#0F766E' },
    });

    const resetButton = screen.getByRole('button', { name: /restaurar cor padrão/i });
    expect(resetButton).toBeEnabled();

    await user.click(resetButton);
    expect(value.resetColor).toHaveBeenCalledOnce();
  });

  it('shows saving status and error alert when provided by context', () => {
    renderSection({
      isSaving: true,
      errorMessage: 'Não foi possível salvar suas preferências.',
    });

    expect(screen.getByText('Salvando...')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível salvar suas preferências.',
    );
  });
});
