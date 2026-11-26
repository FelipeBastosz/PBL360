import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { FALLBACK_TERM_1_2 } from '@/content/legal';
import { AuthProvider } from '@/contexts/AuthProvider';
import { PreferencesProvider } from '@/contexts/PreferencesProvider';
import { ToastProvider } from '@/contexts/ToastProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { commitmentTermsService } from '@/services/commitmentTerms.service';
import { preferencesService } from '@/services/preferences.service';
import type { SessionResponse, UserResponse } from '@/types/auth';
import { DEFAULT_USER_PREFERENCES } from '@/utils/themePalette';

type Entry = string | { pathname: string; search?: string; state?: unknown };

const defaultTermSpies = new WeakSet<object>();

function ensureDefaultCommitmentTermMocks() {
  const acceptanceFn = commitmentTermsService.getMyAcceptanceStatus;
  if (!vi.isMockFunction(acceptanceFn)) {
    const spy = vi.spyOn(commitmentTermsService, 'getMyAcceptanceStatus');
    defaultTermSpies.add(spy);
    spy.mockResolvedValue({
      aceito: true,
      versaoAceita: FALLBACK_TERM_1_2.versao,
      aceitoEm: '2026-11-17T12:00:00.000Z',
      versaoVigente: FALLBACK_TERM_1_2.versao,
    });
  } else if (defaultTermSpies.has(acceptanceFn) || !acceptanceFn.getMockImplementation()) {
    acceptanceFn.mockResolvedValue({
      aceito: true,
      versaoAceita: FALLBACK_TERM_1_2.versao,
      aceitoEm: '2026-11-17T12:00:00.000Z',
      versaoVigente: FALLBACK_TERM_1_2.versao,
    });
  }

  const currentTermFn = commitmentTermsService.getCurrentTerm;
  if (!vi.isMockFunction(currentTermFn)) {
    const spy = vi.spyOn(commitmentTermsService, 'getCurrentTerm');
    defaultTermSpies.add(spy);
    spy.mockResolvedValue(FALLBACK_TERM_1_2);
  } else if (defaultTermSpies.has(currentTermFn) || !currentTermFn.getMockImplementation()) {
    currentTermFn.mockResolvedValue(FALLBACK_TERM_1_2);
  }
}

function ensureDefaultPreferencesMocks() {
  const getFn = preferencesService.getMyPreferences;
  if (!vi.isMockFunction(getFn)) {
    const spy = vi.spyOn(preferencesService, 'getMyPreferences');
    defaultTermSpies.add(spy);
    spy.mockResolvedValue(DEFAULT_USER_PREFERENCES);
  } else if (defaultTermSpies.has(getFn) || !getFn.getMockImplementation()) {
    getFn.mockResolvedValue(DEFAULT_USER_PREFERENCES);
  }
}

export function renderApp(entry: Entry = '/') {
  ensureDefaultCommitmentTermMocks();
  ensureDefaultPreferencesMocks();
  const user = userEvent.setup();
  const result = render(
    <ToastProvider>
      <AuthProvider>
        <PreferencesProvider>
          <MemoryRouter initialEntries={[entry]}>
            <AppRoutes />
          </MemoryRouter>
        </PreferencesProvider>
      </AuthProvider>
    </ToastProvider>,
  );
  return { user, ...result };
}

export const studentUser: UserResponse = {
  id: 'b7a6f3c2-0c1d-4b8e-9f6a-1a2b3c4d5e6f',
  nome: 'Ana Souza',
  email: 'ana@discente.uefs.br',
  tipo: 'ALUNO',
  matricula: '20240001',
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-09-01T10:00:00.000Z',
};

export const tutorUser: UserResponse = {
  id: 'c8b7f4d3-1d2e-5c9f-0a7b-2b3c4d5e6f7a',
  nome: 'Carlos Oliveira',
  email: 'carlos@uefs.br',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-09-01T10:00:00.000Z',
};

export function sessionFor(usuario: UserResponse, expiresInMs = 60 * 60 * 1000): SessionResponse {
  return {
    token: 'jwt-token',
    expiraEm: new Date(Date.now() + expiresInMs).toISOString(),
    usuario,
  };
}
