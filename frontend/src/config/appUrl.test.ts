import { describe, test, expect, afterEach, vi } from 'vitest';

describe('APP_URL via getAppUrl', () => {
  afterEach(() => {
    // limpa os stubs criados nos testes
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  test('usa VITE_APP_URL quando definido', async () => {
    vi.stubEnv('VITE_APP_URL', 'https://my-custom-app.com');
    vi.stubEnv('MODE', 'production'); // mode não importa aqui
    const { getAppUrl } = await import('./appUrl');
    const APP_URL = getAppUrl();
    expect(APP_URL).toBe('https://my-custom-app.com');
  });

  test('fallback para localhost em modo development', async () => {
    vi.stubEnv('VITE_APP_URL', undefined);
    vi.stubEnv('MODE', 'development');
    const { getAppUrl } = await import('./appUrl');
    const APP_URL = getAppUrl();
    expect(APP_URL).toBe('http://localhost:5173');
  });

  test('fallback para produção quando MODE=production', async () => {
    vi.stubEnv('VITE_APP_URL', undefined);
    vi.stubEnv('MODE', 'production');
    const { getAppUrl } = await import('./appUrl');
    const APP_URL = getAppUrl();
    expect(APP_URL).toBe('https://pbl360.com');
  });
});
