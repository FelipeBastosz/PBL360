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
  it('renders all 10 color swatches in exact chromatic palette order and displays active color name', () => {
    renderSection();

    const colorGroup = screen.getByRole('radiogroup', { name: 'Cor do sistema' });
    const swatches = within(colorGroup).getAllByRole('radio');

    expect(swatches).toHaveLength(10);
    expect(swatches.map((el) => el.getAttribute('title'))).toEqual(
      SYSTEM_COLOR_PALETTE.map((c) => c.name),
    );
    expect(screen.getByText('Azul Padrão')).toBeInTheDocument();
    expect(within(colorGroup).getByRole('radio', { name: 'Azul Padrão (padrão)' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('calls setTheme and setColor on click and supports keyboard navigation with arrows and Enter/Space', async () => {
    const user = userEvent.setup();
    const { value } = renderSection();

    const lightRadio = screen.getByRole('radio', { name: 'Claro' });
    const darkRadio = screen.getByRole('radio', { name: 'Escuro' });

    lightRadio.focus();
    await user.keyboard('{ArrowRight}');
    expect(darkRadio).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(value.setTheme).toHaveBeenCalledWith('ESCURO');

    const firstSwatch = screen.getByRole('radio', { name: 'Vermelho Vinho' });
    const secondSwatch = screen.getByRole('radio', { name: 'Vermelho' });
    const sixthSwatch = screen.getByRole('radio', { name: 'Azul Claro' });

    firstSwatch.focus();
    await user.keyboard('{ArrowRight}');
    expect(secondSwatch).toHaveFocus();
    await user.keyboard(' ');
    expect(value.setColor).toHaveBeenCalledWith('#B91C1C');

    firstSwatch.focus();
    await user.keyboard('{ArrowDown}');
    expect(sixthSwatch).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(value.setColor).toHaveBeenCalledWith('#0369A1');
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
    expect(screen.getByText('Verde Petróleo')).toBeInTheDocument();

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
