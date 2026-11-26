import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '@/contexts/authContext';
import { PreferencesProvider } from '@/contexts/PreferencesProvider';
import { PREFERENCES_SAVE_ERROR_MESSAGE } from '@/contexts/preferencesContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { preferencesService } from '@/services/preferences.service';
import { preferencesStore } from '@/services/preferencesStore';
import { studentUser, tutorUser } from '@/testing/renderApp';
import type { UserResponse } from '@/types/auth';
import { resetPreferencesDom } from '@/utils/themeDom';
import { DEFAULT_SYSTEM_COLOR } from '@/utils/themePalette';

vi.mock('@/services/preferences.service', () => ({
  preferencesService: {
    getMyPreferences: vi.fn(),
    updateMyPreferences: vi.fn(),
  },
}));

function PreferencesProbe() {
  const { preferences, errorMessage, setTheme, setColor, resetColor } = useUserPreferences();
  return (
    <div>
      <span data-testid="theme">{preferences.tema}</span>
      <span data-testid="color">{preferences.cor}</span>
      {errorMessage && <div role="alert">{errorMessage}</div>}
      <button type="button" onClick={() => void setTheme('ESCURO')}>
        Ativar escuro
      </button>
      <button type="button" onClick={() => void setTheme('CLARO')}>
        Ativar claro
      </button>
      <button type="button" onClick={() => void setColor('#166534')}>
        Cor verde
      </button>
      <button type="button" onClick={() => void setColor('#9333EA')}>
        Cor lilás
      </button>
      <button type="button" onClick={() => void resetColor()}>
        Restaurar cor
      </button>
    </div>
  );
}

function authValue(user: UserResponse | null): AuthContextValue {
  return {
    user,
    isAuthenticated: user !== null,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  };
}

function renderWithUser(user: UserResponse | null) {
  return render(
    <AuthContext.Provider value={authValue(user)}>
      <PreferencesProvider>
        <PreferencesProbe />
      </PreferencesProvider>
    </AuthContext.Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  resetPreferencesDom();
});

describe('PreferencesProvider', () => {
  it('loads preferences on authentication and applies data-theme and CSS variables to DOM', async () => {
    vi.mocked(preferencesService.getMyPreferences).mockResolvedValue({
      tema: 'ESCURO',
      cor: '#7F1D1D',
    });

    renderWithUser(tutorUser);

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('ESCURO');
      expect(screen.getByTestId('color')).toHaveTextContent('#7F1D1D');
    });
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--color-brand-primary')).toBe(
      '#7F1D1D',
    );
  });

  it('falls back to CLARO and #000077 when unauthenticated or when initial fetch fails', async () => {
    vi.mocked(preferencesService.getMyPreferences).mockRejectedValue(new Error('network'));

    renderWithUser(studentUser);

    await waitFor(() => {
      expect(preferencesService.getMyPreferences).toHaveBeenCalledOnce();
    });
    expect(screen.getByTestId('theme')).toHaveTextContent('CLARO');
    expect(screen.getByTestId('color')).toHaveTextContent(DEFAULT_SYSTEM_COLOR);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('updates theme, color, and restores default color via API', async () => {
    const user = userEvent.setup();
    vi.mocked(preferencesService.getMyPreferences).mockResolvedValue({
      tema: 'CLARO',
      cor: DEFAULT_SYSTEM_COLOR,
    });
    vi.mocked(preferencesService.updateMyPreferences)
      .mockResolvedValueOnce({ tema: 'ESCURO', cor: DEFAULT_SYSTEM_COLOR })
      .mockResolvedValueOnce({ tema: 'ESCURO', cor: '#166534' })
      .mockResolvedValueOnce({ tema: 'ESCURO', cor: DEFAULT_SYSTEM_COLOR });

    renderWithUser(tutorUser);
    await waitFor(() => expect(preferencesService.getMyPreferences).toHaveBeenCalledOnce());

    await user.click(screen.getByRole('button', { name: 'Ativar escuro' }));
    expect(screen.getByTestId('theme')).toHaveTextContent('ESCURO');
    expect(document.documentElement.dataset.theme).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Cor verde' }));
    expect(screen.getByTestId('color')).toHaveTextContent('#166534');
    expect(document.documentElement.style.getPropertyValue('--color-brand-primary')).toBe(
      '#166534',
    );

    await user.click(screen.getByRole('button', { name: 'Restaurar cor' }));
    expect(screen.getByTestId('color')).toHaveTextContent(DEFAULT_SYSTEM_COLOR);
    expect(preferencesService.updateMyPreferences).toHaveBeenNthCalledWith(1, { tema: 'ESCURO' });
    expect(preferencesService.updateMyPreferences).toHaveBeenNthCalledWith(2, { cor: '#166534' });
    expect(preferencesService.updateMyPreferences).toHaveBeenNthCalledWith(3, {
      cor: DEFAULT_SYSTEM_COLOR,
    });
  });

  it('reverts to the last confirmed configuration and shows an alert when PUT fails', async () => {
    const user = userEvent.setup();
    vi.mocked(preferencesService.getMyPreferences).mockResolvedValue({
      tema: 'CLARO',
      cor: '#0369A1',
    });
    vi.mocked(preferencesService.updateMyPreferences).mockRejectedValue(new Error('500'));

    renderWithUser(tutorUser);
    await waitFor(() => expect(screen.getByTestId('color')).toHaveTextContent('#0369A1'));

    await user.click(screen.getByRole('button', { name: 'Ativar escuro' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(PREFERENCES_SAVE_ERROR_MESSAGE);
    expect(screen.getByTestId('theme')).toHaveTextContent('CLARO');
    expect(screen.getByTestId('color')).toHaveTextContent('#0369A1');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.getPropertyValue('--color-brand-primary')).toBe(
      '#0369A1',
    );
  });

  it('resets DOM on logout and isolates preferences across different accounts', async () => {
    vi.mocked(preferencesService.getMyPreferences)
      .mockResolvedValueOnce({ tema: 'ESCURO', cor: '#9333EA' })
      .mockResolvedValueOnce({ tema: 'CLARO', cor: DEFAULT_SYSTEM_COLOR });

    const { rerender } = renderWithUser(tutorUser);
    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('ESCURO');
      expect(screen.getByTestId('color')).toHaveTextContent('#9333EA');
    });
    expect(preferencesStore.read(tutorUser.id)).toEqual({ tema: 'ESCURO', cor: '#9333EA' });
    expect(preferencesStore.read(studentUser.id)).toBeNull();

    // Logout resets DOM and clears cached preferences
    rerender(
      <AuthContext.Provider value={authValue(null)}>
        <PreferencesProvider>
          <PreferencesProbe />
        </PreferencesProvider>
      </AuthContext.Provider>,
    );
    expect(screen.getByTestId('theme')).toHaveTextContent('CLARO');
    expect(screen.getByTestId('color')).toHaveTextContent(DEFAULT_SYSTEM_COLOR);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(preferencesStore.read(tutorUser.id)).toBeNull();

    // Account B loads its own preferences without inheriting anything from Account A
    rerender(
      <AuthContext.Provider value={authValue(studentUser)}>
        <PreferencesProvider>
          <PreferencesProbe />
        </PreferencesProvider>
      </AuthContext.Provider>,
    );
    await waitFor(() => expect(preferencesService.getMyPreferences).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('theme')).toHaveTextContent('CLARO');
    expect(screen.getByTestId('color')).toHaveTextContent(DEFAULT_SYSTEM_COLOR);
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('ignores stale out-of-order PUT responses on rapid consecutive clicks', async () => {
    const user = userEvent.setup();
    vi.mocked(preferencesService.getMyPreferences).mockResolvedValue({
      tema: 'CLARO',
      cor: DEFAULT_SYSTEM_COLOR,
    });

    let resolveFirst!: (val: { tema: 'CLARO'; cor: string }) => void;
    let resolveSecond!: (val: { tema: 'CLARO'; cor: string }) => void;
    vi.mocked(preferencesService.updateMyPreferences)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );

    renderWithUser(tutorUser);
    await waitFor(() => expect(preferencesService.getMyPreferences).toHaveBeenCalledOnce());

    await user.click(screen.getByRole('button', { name: 'Cor verde' }));
    await user.click(screen.getByRole('button', { name: 'Cor lilás' }));

    resolveSecond({ tema: 'CLARO', cor: '#9333EA' });
    await waitFor(() => expect(screen.getByTestId('color')).toHaveTextContent('#9333EA'));

    // Late resolution of first request must not overwrite the latest chosen color
    resolveFirst({ tema: 'CLARO', cor: '#166534' });
    await waitFor(() => {
      expect(screen.getByTestId('color')).toHaveTextContent('#9333EA');
      expect(document.documentElement.style.getPropertyValue('--color-brand-primary')).toBe(
        '#9333EA',
      );
    });
  });
});
